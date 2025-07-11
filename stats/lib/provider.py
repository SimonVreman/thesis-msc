from typing import Literal


def normalize_provider(provider: str) -> Literal["aws", "azure", "gcp"] | None:
    """
    Normalize the provider name to a standard format.
    """
    if provider.lower() in ["aws", "amazon", "amazon web services"]:
        return "aws"
    if provider.lower() in ["azure", "microsoft azure"]:
        return "azure"
    if provider.lower() in ["gcp", "google", "google cloud", "google cloud platform"]:
        return "gcp"

    print(f"Unknown provider: {provider}")
    return None
