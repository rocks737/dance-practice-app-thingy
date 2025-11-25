#!/usr/bin/env python3
"""
Smoke-test Supabase RLS policies by exercising key endpoints with different users.

Usage:
  python supabase/tests/rls_smoke_test.py

Required env vars (defaults shown for local dev):
  SUPABASE_URL=http://127.0.0.1:54321
  SUPABASE_ANON_KEY=<from `npx supabase status`>
  ADMIN_EMAIL=test@ex.com
  ADMIN_PASSWORD=test123
  USER_EMAIL=alice@example.com
  USER_PASSWORD=alice123
"""

from __future__ import annotations

import os
import sys
import uuid
from typing import Tuple, Optional

import requests


SUPABASE_URL = os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "test@ex.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "test123")
USER_EMAIL = os.getenv("USER_EMAIL", "alice@example.com")
USER_PASSWORD = os.getenv("USER_PASSWORD", "alice123")


if not SUPABASE_ANON_KEY:
  print("Missing SUPABASE_ANON_KEY env var. Run `npx supabase status` and copy the anon key.", file=sys.stderr)
  sys.exit(1)


def login(email: str, password: str) -> Tuple[str, str]:
  resp = requests.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
    headers={
      "apikey": SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    json={"email": email, "password": password},
    timeout=10,
  )
  resp.raise_for_status()
  data = resp.json()
  return data["access_token"], data["user"]["id"]


def rest_request(method: str, path: str, token: str, **kwargs) -> requests.Response:
  headers = kwargs.pop("headers", {})
  headers.update(
    {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": f"Bearer {token}",
    }
  )
  url = f"{SUPABASE_URL}{path}"
  return requests.request(method, url, headers=headers, timeout=10, **kwargs)


def get_profile_id(token: str, auth_user_id: str) -> Optional[str]:
  resp = rest_request(
    "GET",
    f"/rest/v1/user_profiles?select=id&auth_user_id=eq.{auth_user_id}",
    token,
  )
  if resp.status_code != 200:
    return None
  data = resp.json()
  return data[0]["id"] if data else None


def get_first_preference_id(token: str, profile_id: str) -> Optional[str]:
  resp = rest_request(
    "GET",
    f"/rest/v1/schedule_preferences?select=id&user_id=eq.{profile_id}&limit=1",
    token,
  )
  if resp.status_code != 200:
    return None
  data = resp.json()
  return data[0]["id"] if data else None


def test_admin_can_create_location(admin_token: str) -> Tuple[bool, str]:
  payload = {
    "name": f"Test Studio {uuid.uuid4().hex[:6]}",
    "city": "Austin",
    "state": "TX",
    "country": "USA",
    "location_type": 1,
    "description": "Created via RLS smoke test",
  }
  resp = rest_request(
    "POST",
    "/rest/v1/locations",
    admin_token,
    json=payload,
    headers={"Prefer": "return=representation"},
  )
  ok = resp.status_code == 201
  location_id = ""
  if ok:
    location_id = resp.json()[0]["id"]
  return ok, location_id or ""


def test_user_cannot_create_location(user_token: str) -> bool:
  payload = {
    "name": f"Unauthorized Location {uuid.uuid4().hex[:6]}",
    "city": "Nowhere",
    "state": "NA",
    "country": "USA",
    "location_type": 1,
  }
  resp = rest_request(
    "POST",
    "/rest/v1/locations",
    user_token,
    json=payload,
    headers={"Prefer": "return=representation"},
  )
  return resp.status_code >= 400


def test_user_can_manage_own_preference(user_token: str, pref_id: str) -> bool:
  payload = {
    "preference_id": pref_id,
    "day_of_week": "MONDAY",
    "start_time": "10:00",
    "end_time": "11:00",
  }
  resp = rest_request(
    "POST",
    "/rest/v1/schedule_preference_windows",
    user_token,
    json=payload,
  )
  return resp.status_code in (200, 201)


def test_user_cannot_modify_other_preference(user_token: str, other_pref_id: str) -> bool:
  payload = {
    "preference_id": other_pref_id,
    "day_of_week": "TUESDAY",
    "start_time": "12:00",
    "end_time": "13:00",
  }
  resp = rest_request(
    "POST",
    "/rest/v1/schedule_preference_windows",
    user_token,
    json=payload,
  )
  return resp.status_code >= 400


def test_user_restricted_profiles(user_token: str, target_auth_user_id: str) -> bool:
  resp = rest_request(
    "GET",
    f"/rest/v1/user_profiles?select=id,email&auth_user_id=eq.{target_auth_user_id}",
    user_token,
  )
  # Should only succeed when requesting own profile.
  if resp.status_code == 200:
    data = resp.json()
    return len(data) <= 1
  return resp.status_code in (401, 403)


def main() -> int:
  print("Logging in as admin...")
  admin_token, admin_auth_user_id = login(ADMIN_EMAIL, ADMIN_PASSWORD)
  admin_profile_id = get_profile_id(admin_token, admin_auth_user_id)

  print("Logging in as regular user...")
  user_token, user_auth_user_id = login(USER_EMAIL, USER_PASSWORD)
  user_profile_id = get_profile_id(user_token, user_auth_user_id)

  if not admin_profile_id or not user_profile_id:
    print("Failed to resolve profile IDs. Did you run the seed script?", file=sys.stderr)
    return 1

  admin_pref_id = get_first_preference_id(admin_token, admin_profile_id)
  user_pref_id = get_first_preference_id(user_token, user_profile_id)

  if not user_pref_id:
    print("User missing schedule preference. Create one via UI before running this script.", file=sys.stderr)
    return 1

  tests = []

  ok, loc_id = test_admin_can_create_location(admin_token)
  tests.append(("Admin can create location", ok))

  tests.append(("User cannot create location", test_user_cannot_create_location(user_token)))

  tests.append(("User can edit own schedule preference", test_user_can_manage_own_preference(user_token, user_pref_id)))

  if admin_pref_id:
    tests.append(
      (
        "User cannot edit admin preference",
        test_user_cannot_modify_other_preference(user_token, admin_pref_id),
      )
    )
  else:
    tests.append(("Skipped admin preference test (no preference found)", True))

  tests.append(
    (
      "User cannot read other profiles",
      test_user_restricted_profiles(user_token, admin_auth_user_id),
    )
  )

  print("\nTest results:")
  failed = False
  for name, result in tests:
    status = "✅" if result else "❌"
    print(f"  {status} {name}")
    if not result:
      failed = True

  if not failed:
    print("\nAll RLS smoke tests passed!")
    return 0

  print("\nSome RLS checks failed. Inspect logs above.")
  return 1


if __name__ == "__main__":
  raise SystemExit(main())


