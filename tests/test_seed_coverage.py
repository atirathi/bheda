"""Every challenge directory under challenges/ must map to a category in
the seed service, or its YAMLs are silently dropped at startup."""
import pathlib

from src.services.seed_service import _DIR_CATEGORY_MAP

CHALLENGES = pathlib.Path(__file__).resolve().parents[1] / "challenges"


def test_every_challenge_dir_is_mapped():
    # Collect the parent dir name of every challenge YAML.
    dirs_with_yaml = {p.parent.name for p in CHALLENGES.rglob("*.yaml")}
    unmapped = sorted(d for d in dirs_with_yaml if d not in _DIR_CATEGORY_MAP)
    assert not unmapped, f"challenge dirs missing from _DIR_CATEGORY_MAP: {unmapped}"
