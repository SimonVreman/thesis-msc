import os
import pandas as pd
from lib.provider import normalize_provider
from typing import Callable
import sys

RESULTS_DIR = "../prototype/out"
# Fraction of actual value to use as margin
PRICE_MARGIN = 0.01
USAGE_MARGIN = 0.01

if len(sys.argv) > 1:
    # 500+ results: 20250715093132-simulation-results.csv
    latest_csv = f"{RESULTS_DIR}/{sys.argv[1]}"
else:
    csv_files = [
        os.path.join(RESULTS_DIR, f)
        for f in os.listdir(RESULTS_DIR)
        if f.endswith(".csv")
    ]
    if not csv_files:
        raise FileNotFoundError("No CSV files found in the results directory.")
    latest_csv = max(csv_files, key=os.path.basename)

# DataFrame with latest results
df = pd.read_csv(latest_csv)

# Normalize provider column
df["provider"] = df["provider"].apply(
    lambda x: None if not isinstance(x, str) else normalize_provider(x)
)

# Add usage wastefulness heuristic as < 10% avg cpu
df["wastefulActual"] = df["avgCpuActual"] < 10

# Clean up wasteful column, NaN to False
df["wasteful"] = df["wasteful"].fillna(False)

# Add reduction metric
df["savings"] = df.apply(
    lambda row: (
        row["priceActual"] - row["newPriceActual"]
        if pd.notnull(row["newPriceActual"])
        and row["wastefulActual"]
        and row["wasteful"]
        else 0
    ),
    axis=1,
)

# Add scenario size
df["scenarioSize"] = df["scenario"] % 10 + 1


# Restrict to scenarios with n or fewer instances
# min_instances = 3
# print(f"Warning: Restricting to scenarios with {min_instances} or fewer instances.")
# df = df[df["scenarioSize"] <= min_instances]


def by_provider(
    dfs: list[pd.DataFrame], name: str, fn: Callable[[pd.DataFrame], str]
) -> None:
    providers = df["providerActual"].unique()
    padding = max(len(p) for p in providers) + 2

    print(f"\nResults for {name}:")
    print(f"{"[all]".ljust(padding)} {" / ".join([fn(x) for x in dfs])}")
    for provider in providers:
        result = " / ".join(
            [fn(x[x["providerActual"] == provider].reset_index()) for x in dfs]
        )
        print(f"{f"[{provider}]".ljust(padding)} {result}")


def metrics_for_series(
    classified_series: pd.Series, true_series: pd.Series | None = None
):
    if true_series is None:
        true_series = pd.Series([True] * len(classified_series))
    tp = (classified_series & true_series).sum()
    fp = (classified_series & ~true_series).sum()
    fn = ((~classified_series) & true_series).sum()
    tn = (~classified_series & ~true_series).sum()

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    accuracy = (tp + tn) / len(classified_series)
    f1_score = (
        2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    )

    return ", ".join(
        [
            f"p: {precision:.3f}",
            f"r: {recall:.3f}",
            f"a: {accuracy:.3f}",
            f"f: {f1_score:.3f}",
        ]
    )


by_provider(
    [df],
    "provider success rate",
    lambda df: metrics_for_series(
        ~(df["provider"].isna()),
        (df["provider"] == df["providerActual"]) | df["provider"].isna(),
    ),
)


df_provider_correct = df[df["provider"] == df["providerActual"]].reset_index()

by_provider(
    [df_provider_correct, df],
    "price success rate: when provider correct / overall",
    lambda df: metrics_for_series(
        ~(df["price"].isna()),
        (abs(df["price"] - df["priceActual"]) < PRICE_MARGIN) | df["price"].isna(),
    ),
)

by_provider(
    [df_provider_correct, df],
    "usage success rate: when provider correct / overall",
    lambda df: metrics_for_series(
        ~(df["avgCpu"].isna()),
        (abs(df["avgCpu"] - df["avgCpuActual"]) < USAGE_MARGIN) | df["avgCpu"].isna(),
    ),
)


df_usage_correct = df[
    abs(df["avgCpu"] - df["avgCpuActual"]) < USAGE_MARGIN
].reset_index()

by_provider(
    [df_usage_correct, df],
    "wasteful sucess rate: when usage correct / overall",
    lambda df: metrics_for_series(df["wasteful"], df["wastefulActual"]),
)


df_wasteful_correct = df[df["wasteful"] == df["wastefulActual"]].reset_index()

by_provider(
    [df_wasteful_correct, df],
    "savings fraction: when wasteful correct / overall",
    lambda df: f"{df["savings"].sum() / df["priceActual"].sum() * 100:.2f}%",
)
