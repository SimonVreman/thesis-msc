import os
import pandas as pd
from lib.provider import normalize_provider

RESULTS_DIR = "../prototype/out"
# Fraction of actual value to use as margin
PRICE_MARGIN = 0.01
USAGE_MARGIN = 0.01

csv_files = [
    os.path.join(RESULTS_DIR, f) for f in os.listdir(RESULTS_DIR) if f.endswith(".csv")
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

provider_success_rate = (df["provider"] == df["providerActual"]).mean()
print(f"Provider success rate: {(provider_success_rate * 100):.2f}%")

price_success_rate = (abs(df["price"] - df["priceActual"]) < PRICE_MARGIN).mean()
print(f"Price success rate: {(price_success_rate * 100):.2f}%")

usage_success_rate = (abs(df["p95Cpu"] - df["p95CpuActual"]) < USAGE_MARGIN).mean()
print(f"Usage success rate: {(usage_success_rate * 100):.2f}%")
