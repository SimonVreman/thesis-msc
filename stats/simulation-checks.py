import sys
import os
import pandas as pd

RESULTS_DIR = "../prototype/out"

if len(sys.argv) > 1:
    latest_csv = f"{RESULTS_DIR}/{sys.argv[1]}"
else:
    csv_files = [
        os.path.join(RESULTS_DIR, f)
        for f in os.listdir(RESULTS_DIR)
        if f.endswith("meta.csv")
    ]
    if not csv_files:
        raise FileNotFoundError("No CSV files found in the results directory.")
    latest_csv = max(csv_files, key=os.path.basename)


df = pd.read_csv(latest_csv)

agents_keys = ["offering", "price", "usage", "waste", "downsize", "downsizePrice"]

print(
    f"\nRan {len(df)} scenarios with {df['success'].sum()} successes and {len(df) - df['success'].sum()} failures."
)

print(f"\nAverage duration was {(df["t_overall"].mean() / 1000):.0f} seconds.")

print(
    f"\nTotal tokens: {sum([df[f"i_{a}"].sum() for a in agents_keys]):.0f} input, {sum([df[f"o_{a}"].sum() for a in agents_keys]):.0f} output."
)

print("\nAgent tokens: input[mean, std.dev] output[mean, std.dev]")
for agent in agents_keys:
    measurements = [
        f"{df[f"i_{agent}"].mean():.3f}",
        f"{df[f"i_{agent}"].std():.3f}",
        f"{df[f"o_{agent}"].mean():.3f}",
        f"{df[f"o_{agent}"].std():.3f}",
    ]

    print(f"{f"[{agent}]".ljust(15)}: {'; '.join([m.ljust(8) for m in measurements])}")
