import pandas as pd

# pylint: disable=unused-import
import scienceplots
import numpy as np
import matplotlib.pyplot as plt
from lib.save_figure import save_figure

plt.style.use(["science", "no-latex"])


def load():
    """
    Load the dataset from a CSV file. The dataset is compressed using gzip.
    """
    path = "azure-dataset/v2/vmtable.csv.gz"
    headers = [
        "vmid",
        "subscriptionid",
        "deploymentid",
        "vmcreated",
        "vmdeleted",
        "maxcpu",
        "avgcpu",
        "p95maxcpu",
        "vmcategory",
        "vmcorecountbucket",
        "vmmemorybucket",
    ]
    df = pd.read_csv(
        path,
        compression="gzip",
        names=headers,
        index_col=False,
        delimiter=",",
    )

    max_value_vmcorecountbucket = 30
    max_value_vmmemorybucket = 70

    df = df.replace({"vmcorecountbucket": ">24"}, max_value_vmcorecountbucket)
    df = df.replace({"vmmemorybucket": ">64"}, max_value_vmmemorybucket)
    df = df.astype({"vmcorecountbucket": int, "vmmemorybucket": int})
    df["lifetime"] = np.maximum((df["vmdeleted"] - df["vmcreated"]), 300) / 3600
    df["corehour"] = df["lifetime"] * df["vmcorecountbucket"]

    return df


def load_azure():
    path = "azure-dataset/v2-prod/"
    return {
        "lifetime": pd.read_csv(f"{path}lifetime.txt", header=0, delimiter="\t"),
        "cpu": pd.read_csv(f"{path}cpu.txt", header=0, delimiter="\t"),
        "memory": pd.read_csv(f"{path}memory.txt", header=0, sep="\t"),
        "cores": pd.read_csv(f"{path}cores.txt", header=0, sep="\t"),
        "category": pd.read_csv(f"{path}category.txt", header=0, sep="\t"),
        "deployment": pd.read_csv(f"{path}deployment.txt", header=0, delimiter="\t"),
    }


def print_bucket_counts(df):
    """
    Print the number of rows in each bucket for vmcorecountbucket and vmmemorybucket.
    """
    df["cross_bucket"] = df["vmcorecountbucket"].combine(
        df["vmmemorybucket"], lambda x, y: f"{x} {y}"
    )
    grouped = df.groupby("cross_bucket")
    # Print the number of rows in each group
    for name, group in grouped:
        print(f"{name}: {len(group)}")


def plot_bucket_bars(df):
    # Prepare data for plotting
    core_buckets = sorted(df["vmcorecountbucket"].unique())
    memory_buckets = sorted(df["vmmemorybucket"].unique())
    cross_counts = (
        df.groupby(["vmcorecountbucket", "vmmemorybucket"]).size().unstack(fill_value=0)
    )

    # Ensure all core and memory buckets are represented
    cross_counts = cross_counts.reindex(
        index=core_buckets, columns=memory_buckets, fill_value=0
    )

    # Plot the stacked bar chart
    cross_counts.plot(kind="bar", stacked=True)

    plt.xlabel("Core Buckets (Count)")
    plt.ylabel("Number of VMs")
    plt.title("VM Memory by Core Count")
    plt.legend(title="Memory Buckets (GB)", loc="center right")
    save_figure("core-memory-buckets", plt.gcf(), (6, 4))


def plot_bucket_pies(df):
    # Prepare data for plotting
    core_buckets = df["vmcorecountbucket"].value_counts().sort_index()
    memory_buckets = df["vmmemorybucket"].value_counts().sort_index()

    def plotPie(data, legend):
        plt.figure()
        data.plot(
            kind="pie",
            autopct=lambda pct: f"{pct:.0f}%" if pct > 1 else "",
            labels=None,
            pctdistance=1.2,
            startangle=90,
        )

        plt.ylabel("")
        plt.legend(
            labels=[f"{bucket}" for bucket in data.index],
            loc="lower center",
            title=legend,
            bbox_to_anchor=(0.5, -0.25),
            ncol=len(data.index),
            handlelength=2 / 3,
            handletextpad=0.4,
            columnspacing=0.6,
        )

    plotPie(core_buckets, "Core Buckets (Count)")
    plt.title("Core Count Distribution", pad=10)
    save_figure("core-buckets-pie", plt.gcf())
    plotPie(memory_buckets, "Memory Buckets (GB)")
    plt.title("Memory Distribution", pad=10)
    save_figure("memory-buckets-pie", plt.gcf())


def print_quantile_avg_cpu(df):
    # Calculate and print quantile summary
    avg_cpu = df["avgcpu"]
    quantiles = avg_cpu.quantile([0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99])
    print("Quantile Summary for Average CPU Usage:")
    for quantile, value in quantiles.items():
        print(f"{int(quantile * 100)}th Percentile: {(value):.2f}%")


def plot_interactivity_pie(df):
    # Calculate and plot interactivity summary
    data = df.groupby("vmcategory")["corehour"].sum()
    plt.figure()
    data.plot(
        kind="pie",
        autopct=lambda pct: f"{pct:.0f}%" if pct > 1 else "",
        labels=None,
        pctdistance=1.2,
        startangle=90,
    )

    plt.ylabel("")
    plt.legend(
        labels=[f"{c}" for c in data.index],
        loc="center right",
        bbox_to_anchor=(1.8, 0.5),
    )
    plt.title("Interactivity Categories", pad=10)
    save_figure("interactivity", plt.gcf())


#
#   Section with comparisons to production data
#


def plot_cpu_comp(df, azure):
    plt.figure()

    for col, label in [("avgcpu", "Average"), ("p95maxcpu", "P95 Max")]:
        data = df[col].dropna().sort_values()
        y = np.linspace(0, 1, len(data))
        plt.plot(data, y, label=f"{label} (dataset)")

        data_azure = azure["cpu"][col].dropna().sort_values() / 100
        plt.plot(data_azure, label=f"{label} (all)", linestyle="--")

    plt.xlabel("Usage (%)")
    plt.ylabel("CDF")
    plt.title("CPU Utilization")
    plt.legend(loc="lower right", handlelength=0.9)
    save_figure("cpu-cdf-comparison", plt.gcf(), (3, 3))


def plot_lifetime_comp(df, azure):
    plt.figure()

    data = df["lifetime"].dropna().sort_values()
    y = np.linspace(0, 1, len(data))
    plt.plot(data, y, label="Lifetime (dataset)")

    data_azure = azure["lifetime"]["value"].dropna().sort_values() / 100
    plt.plot(data_azure, label="Lifetime (all)", linestyle="--")

    plt.xlabel("Lifetime (hours)")
    plt.ylabel("CDF")
    plt.title("VM Lifetime")
    plt.xlim(0, 200)
    plt.legend(loc="lower right", handlelength=0.9)
    save_figure("lifetime-cdf-comparison", plt.gcf(), (3, 3))


def plot_memory_comp(df, azure):
    data = (
        (df["vmmemorybucket"].value_counts(normalize=True) * 100)
        .sort_index()
        .to_frame()
        .T
    )
    data_azure = azure["memory"].set_index("vmmemorybucket").T
    merged = pd.concat([data, data_azure], axis=0).fillna(0)

    ax = merged.plot.bar(stacked=True, ylim=(0, 100), title="VM Memory", align="center")

    plt.xticks(rotation=0)
    ax.set_xticklabels(["Dataset", "All"])
    ax.set_ylabel("Percentage (%)")
    ax.legend(
        loc="lower center",
        bbox_to_anchor=(0.5, -0.3),
        title="Buckets (GB)",
        ncol=len(merged.columns),
        handlelength=2 / 3,
        handletextpad=0.4,
        columnspacing=0.6,
    )

    save_figure("memory-buckets-comparison", plt.gcf(), (3, 3))


def plot_core_comp(df, azure):
    data = (
        (df["vmcorecountbucket"].value_counts(normalize=True) * 100)
        .sort_index()
        .to_frame()
        .T
    )
    data_azure = azure["cores"].set_index("vmcorecountbucket").T
    merged = pd.concat([data, data_azure], axis=0).fillna(0)

    ax = merged.plot.bar(stacked=True, ylim=(0, 100), title="VM Cores", align="center")

    plt.xticks(rotation=0)
    ax.set_xticklabels(["Dataset", "All"])
    ax.set_ylabel("Percentage (%)")
    ax.legend(
        loc="lower center",
        bbox_to_anchor=(0.5, -0.3),
        title="Buckets (Count)",
        ncol=len(merged.columns),
        handlelength=2 / 3,
        handletextpad=0.4,
        columnspacing=0.6,
    )

    save_figure("core-buckets-comparison", plt.gcf(), (3, 3))


loaded = load()
loaded_azure = load_azure()
# plot_bucket_bars(loaded)
# plot_bucket_pies(loaded)
# print_quantile_avg_cpu(loaded)
# plot_interactivity_pie(loaded)
# plot_cpu_comp(loaded, loaded_azure)
# plot_lifetime_comp(loaded, loaded_azure)
# plot_memory_comp(loaded, loaded_azure)
# plot_core_comp(loaded, loaded_azure)
