from typing import Literal


def normalize_provider(provider: str) -> Literal["aws", "azure", "gcp"] | None:
    """
    Normalize the provider name to a standard format.
    """
    if any(
        keyword in provider.lower()
        for keyword in ["aws", "amazon", "amazon web services"]
    ):
        return "aws"
    if any(
        keyword in provider.lower()
        for keyword in ["azure", "microsoft azure", "microsoft"]
    ):
        return "azure"
    if any(
        keyword in provider.lower()
        for keyword in ["gcp", "google", "google cloud", "google cloud platform"]
    ):
        return "gcp"

    print(f"Unknown provider: {provider}")
    return None
