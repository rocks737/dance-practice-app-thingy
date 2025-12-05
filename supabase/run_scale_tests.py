#!/usr/bin/env python3
"""
Run scale integration tests end-to-end:

- Calls seed_via_api.py with extra user / window parameters
- Runs the frontend Jest scale test suite with SCALE_TEST=1

Usage examples (from repo root or supabase/):

  ./run_scale_tests.py
  ./run_scale_tests.py --extra-users 500 --windows-per-user 2
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from typing import Optional, List, Dict, Any


REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUPABASE_DIR = os.path.dirname(os.path.abspath(__file__))


def run_cmd(cmd: list[str], cwd: Optional[str] = None, env: Optional[dict] = None) -> int:
    """Run a subprocess command, streaming output, and return its exit code."""
    proc = subprocess.Popen(
        cmd,
        cwd=cwd,
        env=env,
        stdout=sys.stdout,
        stderr=sys.stderr,
    )
    proc.communicate()
    return proc.returncode


def seed_database(extra_users: int, windows_per_user: Optional[int]) -> List[Dict[str, Any]]:
    """Invoke the Python seed script with scale parameters and capture JSON user list."""
    cmd = ["python3", "seed_via_api.py", "--extra-users", str(extra_users), "--emit-json"]
    if windows_per_user is not None:
        cmd.extend(["--windows-per-user", str(windows_per_user)])

    print("=== Seeding database via seed_via_api.py ===")
    print(f"Working directory: {SUPABASE_DIR}")
    print(f"Command: {' '.join(cmd)}")

    proc = subprocess.run(
        cmd,
        cwd=SUPABASE_DIR,
        capture_output=True,
        text=True,
    )

    # Echo stdout/stderr for visibility
    if proc.stdout:
        sys.stdout.write(proc.stdout)
    if proc.stderr:
        sys.stderr.write(proc.stderr)

    if proc.returncode != 0:
        raise SystemExit(f"Seeding failed with exit code {proc.returncode}")

    # The seed script prints logs plus a final JSON array of seeded users.
    # Parse the last non-empty line as JSON.
    stdout_lines = [line for line in proc.stdout.splitlines() if line.strip()]
    if not stdout_lines:
        raise SystemExit("Seeding completed but no JSON output was found.")

    last_line = stdout_lines[-1]
    try:
        users = json.loads(last_line)
        if not isinstance(users, list):
            raise ValueError("Seed JSON output was not a list.")
        return users
    except Exception as exc:
        raise SystemExit(f"Failed to parse JSON output from seed_via_api.py: {exc}\nLast line: {last_line!r}")


def run_jest_scale_tests(pattern: str, seeded_users: List[Dict[str, Any]]) -> None:
    """Run the Jest scale integration tests in the frontend with SCALE_TEST=1."""
    frontend_dir = os.path.join(REPO_ROOT, "frontend")

    env = os.environ.copy()
    env["SCALE_TEST"] = "1"
    env["SCALE_SEEDED_USERS_JSON"] = json.dumps(seeded_users)

    cmd = ["npm", "test", "--", pattern, "--no-coverage"]

    print("=== Running Jest scale integration tests ===")
    print(f"Working directory: {frontend_dir}")
    print(f"Command: {' '.join(cmd)}")

    code = run_cmd(cmd, cwd=frontend_dir, env=env)
    if code != 0:
        raise SystemExit(f"Jest scale tests failed with exit code {code}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run scale integration tests for matching.")
    parser.add_argument(
        "--extra-users",
        type=int,
        default=200,
        help="Number of additional generic test users to create (default: 200).",
    )
    parser.add_argument(
        "--windows-per-user",
        type=int,
        default=2,
        help="Maximum number of availability windows to create per user (default: 2).",
    )
    parser.add_argument(
        "--pattern",
        type=str,
        default="src/__tests__/matches-.*integration.test.ts",
        help="Jest test pattern to run for scale tests (default: all matches-* integration tests).",
    )

    args = parser.parse_args()

    # Step 1: Seed DB at scale (and capture seeded users)
    seeded_users = seed_database(extra_users=args.extra_users, windows_per_user=args.windows_per_user)

    # Step 2: Run scale Jest suite with seeded user info in env
    # Also pass through the windows_per_user value so tests can reason about
    # expected overlap heuristics.
    os.environ["SCALE_WINDOWS_PER_USER"] = str(args.windows_per_user)
    run_jest_scale_tests(pattern=args.pattern, seeded_users=seeded_users)

    print("\n✅ Scale integration tests completed successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())


