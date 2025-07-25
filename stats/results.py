import os
import pandas as pd
from lib.provider import normalize_provider
from typing import Callable
import sys
from statsmodels.stats.proportion import proportion_confint
from lib.downsize import downsized

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

# Clean up wasteful and newType columns
df["wasteful"] = df["wasteful"].replace({np.nan: False, None: False})
df["newType"] = df["newType"].replace({np.nan: None})


# Add actual downsize column
def row_downsized(row, field: str):
    downsized_type = downsized(row["type"])
    if downsized_type is not None and row["wastefulActual"]:
        return downsized_type[field]
    return None


df["newTypeActual"] = df.apply(lambda row: row_downsized(row, "name"), axis=1)  # type: ignore
df["newPriceActual"] = df.apply(lambda row: row_downsized(row, "price"), axis=1)  # type: ignore

# Add reduction metrics
df["theoreticalSavings"] = df.apply(
    lambda row: (
        (row["priceActual"] - row["newPriceActual"]) if row["wastefulActual"] else 0
    ),
    axis=1,
)
df["savings"] = df.apply(
    lambda row: (
        row["theoreticalSavings"] if row["newType"] == row["newTypeActual"] else 0
    ),
    axis=1,
)

# Add scenario size
df["scenarioSize"] = df["scenario"] % 10 + 1
# df = df[df["scenarioSize"] == 10]


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


def calculate_savings(savings_df: pd.DataFrame) -> float:
    if savings_df["priceActual"].sum() > 0:
        return savings_df["savings"].sum() / savings_df["priceActual"].sum()
    return 0


by_provider(
    [df],
    "price success rate: overall",
    lambda df: metrics_for_series(
        ~(df["price"].isna()),
        (abs(df["price"] - df["priceActual"]) < PRICE_MARGIN) | df["price"].isna(),
    ),
)

by_provider(
    [df],
    "usage success rate: overall",
    lambda df: metrics_for_series(
        ~(df["avgCpu"].isna()),
        (abs(df["avgCpu"] - df["avgCpuActual"]) < USAGE_MARGIN) | df["avgCpu"].isna(),
    ),
)

by_provider(
    [df],
    "downsize success rate: overall",
    lambda df: metrics_for_series(
        ~(df["newType"].isna()),
        (~df["newTypeActual"].isna())
        & ((df["newType"]).isna() | (df["newType"] == df["newTypeActual"])),
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

df_theoretical_savings = df.assign(savings=df["theoreticalSavings"])

by_provider(
    [df, df_theoretical_savings],
    "savings fraction: actual / theoretical",
    lambda df: f"{(calculate_savings(df) * 100):.2f}%",
)


# Charts


def plot_metric_by_size(title, df, metric_col, actual_col, margin, name):
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

    # Add a super-title above all three charts
    fig.suptitle(title, fontsize=14)

    i = 0
    for ax, metric, plot_title in zip(axes, metric_names, titles):
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
            capsize=3,
        )
        ax.set_title(plot_title)
        ax.set_xlabel("VMs per scenario")
        ax.set_ylabel("Score")
        ax.set_xticks(np.linspace(min(sizes), max(sizes), 4, dtype=int))
        i += 1

    plt.tight_layout()
    save_figure(f"results/{name}", fig, (8, 3))


def plot_price_bar_chart(name):
    def compute_savings(scoped_df: pd.DataFrame, provider: str | None = None):
        if provider:
            scoped_df = scoped_df[scoped_df["provider"] == provider]

        bootstrap_savings = []
        for _ in range(1000):
            bootstrap_df = scoped_df.sample(
                n=len(scoped_df), replace=True, random_state=1
            )
            bootstrap_savings.append(calculate_savings(bootstrap_df))

        return {
            "value": calculate_savings(scoped_df),
            "ci_lower": np.percentile(bootstrap_savings, 2.5),
            "ci_upper": np.percentile(bootstrap_savings, 97.5),
        }

    categories = ("All", "AWS", "Azure", "GCP")
    data = {
        "Actual": (
            compute_savings(df),
            compute_savings(df, "aws"),
            compute_savings(df, "azure"),
            compute_savings(df, "gcp"),
        ),
        "Benchmark": (
            compute_savings(df_theoretical_savings),
            compute_savings(df_theoretical_savings, "aws"),
            compute_savings(df_theoretical_savings, "azure"),
            compute_savings(df_theoretical_savings, "gcp"),
        ),
    }

    x = np.arange(len(categories))  # the label locations
    width = 1 / (len(data.keys()) + 1)  # the width of the bars
    multiplier = 0

    fig, ax = plt.subplots(layout="constrained")

    for attribute, measurement in data.items():
        offset = width * multiplier
        height = [x["value"] * 100 for x in measurement]
        lower = [abs(x["value"] * 100 - x["ci_lower"] * 100) for x in measurement]
        upper = [abs(x["ci_upper"] * 100 - x["value"] * 100) for x in measurement]
        rects = ax.bar(
            x + offset, height, width, label=attribute, yerr=[lower, upper], capsize=5
        )
        ax.bar_label(rects, padding=5, fmt="%.1f%%")
        multiplier += 1

    ax.set_ylabel("Savings (%)")
    ax.set_title("Cost Reduction by Provider")
    ax.set_xticks(x + width / 2, categories)
    ax.set_ymargin(0.2)
    ax.legend(
        ncols=3,
        loc="lower center",
        bbox_to_anchor=(0.5, -0.2),
    )

    save_figure(f"results/{name}", fig, (5, 4))


def plot_price_benchmark_chart(name):
    def compute_savings(scoped_df: pd.DataFrame, provider: str | None = None):
        if provider:
            scoped_df = scoped_df[scoped_df["provider"] == provider]

        bootstrap_savings = []
        for _ in range(1000):
            bootstrap_df = scoped_df.sample(
                n=len(scoped_df), replace=True, random_state=1
            )
            savings = calculate_savings(bootstrap_df)
            theoretical = calculate_savings(
                bootstrap_df.assign(savings=bootstrap_df["theoreticalSavings"])
            )
            bootstrap_savings.append(savings / theoretical if theoretical > 0 else 0)

        savings = calculate_savings(scoped_df)
        theoretical = calculate_savings(
            scoped_df.assign(savings=scoped_df["theoreticalSavings"])
        )

        return {
            "value": savings / theoretical if theoretical > 0 else 0,
            "ci_lower": np.percentile(bootstrap_savings, 2.5),
            "ci_upper": np.percentile(bootstrap_savings, 97.5),
        }

    categories = ("All", "AWS", "Azure", "GCP")
    data = (
        compute_savings(df),
        compute_savings(df, "aws"),
        compute_savings(df, "azure"),
        compute_savings(df, "gcp"),
    )

    x = np.arange(len(categories))
    height = [item["value"] * 100 for item in data]
    lower = [abs(item["value"] * 100 - item["ci_lower"] * 100) for item in data]
    upper = [abs(item["ci_upper"] * 100 - item["value"] * 100) for item in data]
    width = 0.6

    fig, ax = plt.subplots(figsize=(6, 4))
    colors = [f"C{i}" for i in range(len(categories))]
    rects = ax.bar(x, height, width, yerr=[lower, upper], capsize=5, color=colors)
    ax.bar_label(rects, padding=5, fmt="%.1f%%")

    # Add threshold line at 80%, dashed
    ax.axhline(80, color="black", linestyle="--", linewidth=1, label="80% Threshold")

    ax.set_ylabel("Percentage of Benchmark (%)")
    ax.set_title("Cost Reduction Relative to Benchmark")
    ax.set_xticks(x, categories)
    ax.set_ymargin(0.2)
    ax.legend(
        loc="lower center",
        bbox_to_anchor=(0.5, -0.2),
    )

    save_figure(f"results/{name}", fig, (5, 4))


# Price
plot_metric_by_size(
    "Price Performance by VM Count (overall)",
    df,
    "price",
    "priceActual",
    PRICE_MARGIN,
    "pricing-size",
)


# Usage
plot_metric_by_size(
    "Usage Performance by VM Count (overall)",
    df,
    "avgCpu",
    "avgCpuActual",
    USAGE_MARGIN,
    "usage-size",
)


# Waste
plot_metric_by_size(
    "Waste Performance by VM Count (overall)",
    df,
    "wasteful",
    "wastefulActual",
    None,
    "wasteful-size",
)
plot_metric_by_size(
    "Waste Performance by VM Count (isolated)",
    df_usage_correct,
    "wasteful",
    "wastefulActual",
    None,
    "wasteful-size-isolated",
)

plot_price_bar_chart("savings-bars")
plot_price_benchmark_chart("savings-benchmark-bars")

print(f"\nGot results for {len(df)} VMs in {len(df['scenario'].unique())} scenarios.")

# None  None    => true negative    => ~a & ~b
# None  1       => false negative   => ~a & b
# 1     None    => false positive   => a & ~b
# 1     1       => true positive    => a & b
# 1     2       => false positive   => a & ~b

# a => ~guess.isna()
# b => ~actual.isna() & (guess.isna() | actual == guess)
