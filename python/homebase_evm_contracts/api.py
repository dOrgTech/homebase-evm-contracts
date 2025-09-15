import json
from importlib import resources


_ABI_FILES = {
    ("wrapper", None): "wrapper_v2.abi.json",
    ("wrapper", "v2"): "wrapper_v2.abi.json",
    ("wrapper", "current"): "wrapper_v2.abi.json",
    ("wrapper", "legacy"): "wrapper_v1.abi.json",
    ("governor", None): "governor_min.abi.json",
    ("token", None): "token_min.abi.json",
}


def get_abi(name: str, variant: str | None = None):
    """
    Return the curated ABI (as a Python list) for a known contract.

    Args:
        name: One of {"wrapper", "governor", "token"}
        variant: For wrapper, optionally {"legacy", "v2"}. Default is current (v2).

    Raises:
        KeyError if the (name, variant) is unknown.
    """
    key = (name, variant)
    filename = _ABI_FILES.get(key)
    if not filename:
        # Fallback to default variant when variant is None
        filename = _ABI_FILES.get((name, None))
    if not filename:
        raise KeyError(f"No ABI available for {name!r} (variant={variant!r})")

    data = resources.read_text("homebase_evm_contracts.abis", filename)
    return json.loads(data)

