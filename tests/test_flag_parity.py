"""The backend (Python) and vuln-app (TypeScript) flag generators MUST
produce identical flags for the same challenge_id + FLAG_SECRET, or no
flag a player extracts from the vuln-app will validate in the backend.

This test executes the REAL flag.ts via ts-node so drift is caught.
"""
import os
import shutil
import subprocess
import textwrap

import pytest

PARITY_SECRET = "parity_test_secret_at_least_32_chars_xx"
IDS = ["sqli-01", "sqli-16", "jwt-08", "boss-ragnarok", "rh-01"]

VULN_APP = os.path.join(os.path.dirname(__file__), "..", "vuln-app")


def _python_flags():
    os.environ["FLAG_SECRET"] = PARITY_SECRET
    from src.config import get_settings
    get_settings.cache_clear()  # pick up the env we just set
    from src.utils.flag import generate_flag
    return {i: generate_flag(i) for i in IDS}


def _node_flags():
    script = textwrap.dedent("""
        import { generateFlag } from './utils/flag';
        const ids = process.argv.slice(2);
        for (const id of ids) console.log(id + '\\t' + generateFlag(id));
    """)
    tmp = os.path.join(VULN_APP, "src", "_paritycheck.ts")
    with open(tmp, "w") as f:
        f.write(script)
    try:
        out = subprocess.check_output(
            ["npx", "ts-node", "--compiler-options", '{"module":"commonjs"}',
             "src/_paritycheck.ts", *IDS],
            cwd=VULN_APP,
            env={**os.environ, "FLAG_SECRET": PARITY_SECRET},
            stderr=subprocess.STDOUT, text=True,
        )
    finally:
        os.remove(tmp)
    flags = {}
    for line in out.strip().splitlines():
        if "\t" in line and line.startswith("BHEDA") is False:
            cid, flag = line.split("\t", 1)
            flags[cid] = flag
    return flags


@pytest.mark.skipif(shutil.which("npx") is None
                    or not os.path.isdir(os.path.join(VULN_APP, "node_modules")),
                    reason="vuln-app node deps not installed")
def test_python_and_node_flags_match():
    py = _python_flags()
    node = _node_flags()
    for i in IDS:
        assert py[i] == node.get(i), f"{i}: python={py[i]} node={node.get(i)}"
