"""Canonical scoring rules — the backend (Postgres leaderboard) and the
ctf-engine (Redis leaderboard) MUST agree, or the two leaderboards rank
teams differently. These tests pin the canonical formula."""
import asyncio

from src.services.scoring_service import ScoringService


class FakeChallenge:
    def __init__(self, points, difficulty):
        self.points = points
        self.difficulty = difficulty


def score(points, difficulty, chain_depth=0, first_blood=False):
    return asyncio.run(
        ScoringService.calculate_score(
            FakeChallenge(points, difficulty), chain_depth, first_blood
        )
    )


def test_difficulty_multipliers():
    assert score(100, "beginner") == 50
    assert score(100, "easy") == 100
    assert score(100, "medium") == 150
    assert score(100, "hard") == 200
    assert score(100, "expert") == 300
    assert score(100, "insane") == 300
    assert score(100, "boss") == 400


def test_unknown_difficulty_defaults_to_1x():
    assert score(100, "weird") == 100


def test_chain_multiplier_is_15pct_per_depth():
    # easy, 2 deep: 100 * 1.0 * (1 + 0.15*2) = 130
    assert score(100, "easy", chain_depth=2) == 130


def test_first_blood_is_1_5x():
    # easy, first blood: 100 * 1.0 * 1.5 = 150
    assert score(100, "easy", first_blood=True) == 150


def test_combined():
    # hard, depth 1, first blood: 100 * 2.0 * 1.15 * 1.5 = 345
    assert score(100, "hard", chain_depth=1, first_blood=True) == 345
