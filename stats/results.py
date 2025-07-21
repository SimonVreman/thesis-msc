import os
import pandas as pd
from lib.provider import normalize_provider
from typing import Callable
import sys
from statsmodels.stats.proportion import proportion_confint

# pylint: disable=unused-import
import scienceplots
import matplotlib.pyplot as plt
from lib.save_figure import save_figure
import numpy as np

plt.style.use(["science", "no-latex"])

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
# df = df[df["scenarioSize"] == 5]


def by_provider(
    dfs: list[pd.DataFrame], name: str, fn: Callable[[pd.DataFrame], str]
) -> None:
    providers = sorted(df["providerActual"].unique())
    padding = max(len(p) for p in providers) + 2

    print(f"\nResults for {name}:")
    for provider in providers:
        result = " / ".join(
            [fn(x[x["providerActual"] == provider].reset_index()) for x in dfs]
        )
        print(f"{f"[{provider}]".ljust(padding)} {result}")

    print(f"{"[all]".ljust(padding)} {" / ".join([fn(x) for x in dfs])}")


def metrics_for_series(classified_series: pd.Series, true_series: pd.Series):
    tp = (classified_series & true_series).sum()
    fp = (classified_series & ~true_series).sum()
    fn = ((~classified_series) & true_series).sum()
    tn = (~classified_series & ~true_series).sum()

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    p_wilson = proportion_confint(tp, tp + fp, method="wilson")
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    r_wilson = proportion_confint(tp, tp + fn, method="wilson")
    accuracy = (tp + tn) / len(classified_series)
    a_wilson = proportion_confint(tp + tn, len(classified_series), method="wilson")
    f1_score = (
        2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    )

    fmt = lambda x: f"{x:.3f}".lstrip("0")

    return "a/p/r/f: " + "; ".join(
        [
            f"{fmt(accuracy)} [{fmt(a_wilson[0])}, {fmt(a_wilson[1])}]",
            f"{fmt(precision)} [{fmt(p_wilson[0])}, {fmt(p_wilson[1])}]",
            f"{fmt(recall)} [{fmt(r_wilson[0])}, {fmt(r_wilson[1])}]",
            f"{fmt(f1_score)}",
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


# Charts


def plot_metric_by_size(metric_col, actual_col, margin, name):
    """
    Plots accuracy, precision, and recall for a given metric by scenario size with error bars in three subplots.
    metric_col: column with predicted values (e.g., "price", "avgCpu", "wasteful")
    actual_col: column with actual values (e.g., "priceActual", "avgCpuActual", "wastefulActual")
    margin: allowed margin for correctness (ignored for boolean metrics)
    name: output file name (e.g., "pricing-size")
    ylabel: label for y-axis
    """
    sizes = sorted(df["scenarioSize"].unique())
    metrics = {"accuracy": [], "precision": [], "recall": []}
    ci = {"accuracy": [], "precision": [], "recall": []}

    for size in sizes:
        subset = df[df["scenarioSize"] == size]
        if subset[metric_col].dtype == "bool" or subset[actual_col].dtype == "bool":
            classified = subset[metric_col]
            true = subset[actual_col]
        else:
            classified = ~(subset[metric_col].isna())
            true = (abs(subset[metric_col] - subset[actual_col]) < margin) | subset[
                metric_col
            ].isna()

        tp = (classified & true).sum()
        fp = (classified & ~true).sum()
        fn = ((~classified) & true).sum()
        tn = (~classified & ~true).sum()

        acc = (tp + tn) / len(subset) if len(subset) > 0 else 0
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0

        metrics["accuracy"].append(acc)
        metrics["precision"].append(prec)
        metrics["recall"].append(rec)

        acc_ci = (
            proportion_confint(tp + tn, len(subset), method="wilson")
            if len(subset) > 0
            else (0, 0)
        )
        prec_ci = (
            proportion_confint(tp, tp + fp, method="wilson")
            if (tp + fp) > 0
            else (0, 0)
        )
        rec_ci = (
            proportion_confint(tp, tp + fn, method="wilson")
            if (tp + fn) > 0
            else (0, 0)
        )

        ci["accuracy"].append(acc_ci)
        ci["precision"].append(prec_ci)
        ci["recall"].append(rec_ci)

    fig, axes = plt.subplots(1, 3, figsize=(8, 3), sharex=True)
    metric_names = metrics.keys()
    titles = ["Accuracy", "Precision", "Recall"]

    i = 0
    for ax, metric, title in zip(axes, metric_names, titles):
        values = metrics[metric]
        confs = ci[metric]
        lower = np.abs([v - c[0] for v, c in zip(values, confs)])
        upper = np.abs([c[1] - v for v, c in zip(values, confs)])
        ax.errorbar(
            sizes,
            values,
            yerr=[lower, upper],
            fmt="-o",
            color=f"C{i}",
            label=metric.capitalize(),
        )
        ax.set_title(title)
        ax.set_xlabel("VMs per scenario")
        ax.set_ylabel("Score")
        i += 1

    plt.tight_layout()
    save_figure(f"results/{name}", fig, (8, 3))


# Example usage:
plot_metric_by_size("price", "priceActual", PRICE_MARGIN, "pricing-size")
plot_metric_by_size("avgCpu", "avgCpuActual", USAGE_MARGIN, "usage-size")
plot_metric_by_size("wasteful", "wastefulActual", None, "wasteful-size")
