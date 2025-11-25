#!/usr/bin/env python3
"""
Seed local Supabase via APIs (no direct DB access).

Creates:
- Two auth users (Alice, Bob) via GoTrue
- A shared practice location via PostgREST
- User profiles + DANCER role
- Schedule preferences with overlapping availability windows

Requirements:
  - Local Supabase running (npx supabase start)
  - requests (pip install requests --break-system-packages)

Config resolution order:
  - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY env vars
  - Fallback: parse `npx supabase status` output locally
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import uuid
from typing import Any, Dict, Optional, Tuple
from datetime import datetime, timezone

try:
    import requests
except Exception:
    print("Missing dependency: requests")
    print("Install it with: pip3 install requests --break-system-packages")
    sys.exit(1)


# ------------------------------
# Configuration
# ------------------------------

DEFAULT_SUPABASE_URL = "http://127.0.0.1:54321"

USERS = [
    {
        "email": "alice@example.com",
        "password": "alice123",
        "first_name": "Alice",
        "last_name": "Johnson",
        "display_name": "Alice J.",
        "primary_role": 0,  # LEADER
        "wsdc_level": 2,  # INTERMEDIATE
        "competitiveness_level": 3,
        "bio": "Love West Coast Swing! Looking for practice partners to work on musicality and connection.",
        "dance_goals": "Compete in intermediate division next year",
        "availability_key": "alice",
        "roles": ["DANCER"],
    },
    {
        "email": "bob@example.com",
        "password": "bob123",
        "first_name": "Bob",
        "last_name": "Martinez",
        "display_name": "Bob M.",
        "primary_role": 1,  # FOLLOW
        "wsdc_level": 2,  # INTERMEDIATE
        "competitiveness_level": 3,
        "bio": "Intermediate follow looking to improve technique and styling.",
        "dance_goals": "Master all-skate competitions and improve frame",
        "availability_key": "bob",
        "roles": ["DANCER"],
    },
    {
        "email": "test@ex.com",
        "password": "test123",
        "first_name": "Test",
        "last_name": "User",
        "display_name": "Test U.",
        "primary_role": 0,  # LEADER
        "wsdc_level": 1,  # NOVICE
        "competitiveness_level": 3,
        "bio": "Test account for local development.",
        "dance_goals": "Try seeding via API",
        "availability_key": "test",
        "roles": ["DANCER", "ADMIN"],
    },
]

LOCATION = {
    "name": "Dance Studio Downtown",
    "description": "Popular practice space in downtown area",
    "address_line1": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94102",
    "country": "USA",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "location_type": 1,  # STUDIO
}

AVAILABILITY = {
    "alice": [
        {"day": "TUESDAY", "start": "18:00:00", "end": "21:00:00"},
        {"day": "WEDNESDAY", "start": "19:00:00", "end": "22:00:00"},
        {"day": "THURSDAY", "start": "18:00:00", "end": "21:00:00"},
        {"day": "SATURDAY", "start": "10:00:00", "end": "14:00:00"},
    ],
    "bob": [
        {"day": "MONDAY", "start": "19:00:00", "end": "21:00:00"},
        {"day": "TUESDAY", "start": "18:00:00", "end": "21:00:00"},
        {"day": "THURSDAY", "start": "18:00:00", "end": "21:00:00"},
        {"day": "FRIDAY", "start": "18:00:00", "end": "20:00:00"},
        {"day": "SATURDAY", "start": "10:00:00", "end": "14:00:00"},
    ],
    "test": [
        {"day": "TUESDAY", "start": "18:00:00", "end": "21:00:00"},
        {"day": "THURSDAY", "start": "18:00:00", "end": "21:00:00"},
        {"day": "SATURDAY", "start": "10:00:00", "end": "14:00:00"},
    ],
}

FOCUS_AREAS = ["TECHNIQUE", "MUSICALITY", "CONNECTION"]
SKILL_LEVELS = ["NOVICE", "INTERMEDIATE", "ADVANCED"]


# ------------------------------
# Helpers
# ------------------------------

def run_supabase_status() -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Returns (url, anon_key, service_key) by parsing `npx supabase status`.
    """
    try:
        proc = subprocess.run(
            ["npx", "supabase", "status"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            text=True,
        )
        out = proc.stdout.strip()
        url = None
        anon = None
        service = None
        for line in out.splitlines():
            line = line.strip()
            if line.startswith("API URL:"):
                url = line.split("API URL:")[1].strip()
            elif line.startswith("Publishable key:"):
                anon = line.split("Publishable key:")[1].strip()
            elif line.startswith("Secret key:"):
                service = line.split("Secret key:")[1].strip()
        return (url, anon, service)
    except Exception:
        return (None, None, None)


def resolve_config() -> Tuple[str, str, str]:
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL") or DEFAULT_SUPABASE_URL
    anon = os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    service = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not (anon and service):
        s_url, s_anon, s_service = run_supabase_status()
        if s_url:
            url = s_url
        if not anon and s_anon:
            anon = s_anon
        if not service and s_service:
            service = s_service

    if not anon or not service:
        print("Unable to resolve Supabase keys. Set SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.")
        sys.exit(1)

    return url.rstrip("/"), anon, service


def http(
    method: str,
    url: str,
    headers: Dict[str, str],
    json_body: Optional[Dict[str, Any]] = None,
    params: Optional[Dict[str, Any]] = None,
) -> requests.Response:
    fn = getattr(requests, method.lower())
    resp = fn(url, headers=headers, json=json_body, params=params, timeout=30)
    return resp


# ------------------------------
# Auth
# ------------------------------

def signup(url: str, anon_key: str, email: str, password: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Sign up a user via GoTrue (public). Returns (access_token, user_id).
    If user already exists, returns (None, None).
    """
    headers = {
        "apikey": anon_key,
        "Content-Type": "application/json",
    }
    data = {
        "email": email,
        "password": password,
        "data": {},  # user metadata
    }
    resp = http("post", f"{url}/auth/v1/signup", headers, json_body=data)
    if resp.status_code in (200, 201):
        payload = resp.json()
        user_id = payload.get("user", {}).get("id")
        # Depending on config (enable_confirmations=false), a session may be returned
        access_token = payload.get("access_token") or (payload.get("session") or {}).get("access_token")
        return (access_token, user_id)
    # If already registered, GoTrue returns 400 with error
    return (None, None)


def signin(url: str, anon_key: str, email: str, password: str) -> Tuple[str, str]:
    """
    Sign in a user via GoTrue (public). Returns (access_token, user_id).
    """
    headers = {
        "apikey": anon_key,
        "Content-Type": "application/json",
    }
    data = {"email": email, "password": password}
    resp = http("post", f"{url}/auth/v1/token?grant_type=password", headers, json_body=data)
    if resp.status_code in (200, 201):
        payload = resp.json()
        access_token = payload.get("access_token")
        user_id = (payload.get("user") or {}).get("id")
        # Fallback: user may not be in payload, but token subject will be the user id
        if not user_id and access_token:
            try:
                # Extract user id (sub) from JWT without verification (structure: header.payload.sig)
                body_b64 = access_token.split(".")[1]
                # pad base64
                pad = "=" * (-len(body_b64) % 4)
                import base64

                body = json.loads(base64.urlsafe_b64decode(body_b64 + pad))
                user_id = body.get("sub")
            except Exception:
                pass
        if access_token and user_id:
            return (access_token, user_id)
    raise RuntimeError(f"Sign-in failed for {email}: {resp.status_code} {resp.text}")


# ------------------------------
# REST helpers (PostgREST)
# ------------------------------

def rest_headers(key: str, bearer: Optional[str] = None) -> Dict[str, str]:
    h = {
        "apikey": key,
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates",
    }
    if bearer:
        h["Authorization"] = f"Bearer {bearer}"
    return h


def rest_get(url: str, key: str, bearer: str, path: str, params: Dict[str, Any]) -> Tuple[int, Any]:
    r = http("get", f"{url}/rest/v1/{path}", rest_headers(key, bearer), params=params)
    try:
        return r.status_code, r.json()
    except Exception:
        return r.status_code, r.text


def rest_insert(url: str, key: str, bearer: str, path: str, rows: Any, params: Optional[Dict[str, Any]] = None) -> Tuple[int, Any]:
    r = http("post", f"{url}/rest/v1/{path}", rest_headers(key, bearer), json_body=rows, params=params or {})
    try:
        return r.status_code, r.json()
    except Exception:
        return r.status_code, r.text


# ------------------------------
# Seed logic
# ------------------------------

def create_or_get_location(url: str, admin_key: str) -> str:
    # Try to find existing by name
    status, body = rest_get(url, admin_key, admin_key, "locations", {"select": "id", "name": f"eq.{LOCATION['name']}"})
    if status == 200 and isinstance(body, list) and body:
        return body[0]["id"]
    # Create (DB auto-generates id)
    status, body = rest_insert(url, admin_key, admin_key, "locations", [LOCATION])
    if status in (200, 201) and isinstance(body, list) and body:
        return body[0]["id"]
    raise RuntimeError(f"Failed to create location: {status} {body}")


def create_or_upsert_profile(url: str, key: str, bearer: str, auth_user_id: str, user: Dict[str, Any]) -> str:
    # First, see if one already exists
    status, body = rest_get(url, key, bearer, "user_profiles", {"select": "id", "auth_user_id": f"eq.{auth_user_id}"})
    if status == 200 and isinstance(body, list) and body:
        return body[0]["id"]

    # Insert a new profile (DB auto-generates id)
    now_iso = datetime.now(timezone.utc).isoformat()
    payload = {
        "auth_user_id": auth_user_id,
        "email": user["email"],
        "first_name": user.get("first_name", ""),
        "last_name": user.get("last_name", ""),
        "display_name": user.get("display_name"),
        "primary_role": user.get("primary_role", 0),
        "wsdc_level": user.get("wsdc_level", 2),
        "competitiveness_level": user.get("competitiveness_level", 3),
        "profile_visible": True,
        "account_status": 0,
        "created_at": now_iso,
        "updated_at": now_iso,
        "version": 0,
    }
    headers_key = key
    status, body = rest_insert(url, headers_key, bearer, "user_profiles", [payload])
    if status in (200, 201) and isinstance(body, list) and body:
        return body[0]["id"]
    # Fallback: fetch existing (in case of race or conflict on email)
    status, body = rest_get(url, headers_key, bearer, "user_profiles", {"select": "id", "auth_user_id": f"eq.{auth_user_id}"})
    if status == 200 and isinstance(body, list) and body:
        return body[0]["id"]
    raise RuntimeError(f"Failed to upsert user profile: {status} {body}")


def ensure_roles(url: str, key: str, bearer: str, profile_id: str, roles: list[str]) -> None:
    params = {"on_conflict": "user_id,role"}
    rows = [{"user_id": profile_id, "role": r} for r in roles]
    status, _ = rest_insert(url, key, bearer, "user_roles", rows, params=params)
    if status not in (200, 201):
        # It's ok if they already exist
        pass


def create_schedule_preferences(
    url: str,
    key: str,
    bearer: str,
    profile_id: str,
    location_id: str,
    windows: list[Dict[str, str]],
) -> str:
    # Check if already exists
    status, body = rest_get(url, key, bearer, "schedule_preferences", {"select": "id", "user_id": f"eq.{profile_id}"})
    if status == 200 and isinstance(body, list) and body:
        return body[0]["id"]

    pref = {
        "user_id": profile_id,
        "max_travel_distance_km": 25,
        "location_note": "Prefer downtown locations",
        "notes": "Available for regular practice sessions",
    }
    s, b = rest_insert(url, key, bearer, "schedule_preferences", [pref])
    if s in (200, 201) and isinstance(b, list) and b:
        pref_id = b[0]["id"]
    else:
        raise RuntimeError(f"Failed to create schedule_preferences: {s} {b}")

    # Link location
    s, b = rest_insert(
        url,
        key,
        bearer,
        "schedule_preference_locations",
        [{"preference_id": pref_id, "location_id": location_id}],
    )
    if s not in (200, 201):
        raise RuntimeError(f"Failed to link preference location: {s} {b}")

    # Windows
    win_rows = []
    for w in windows:
        win_rows.append(
            {
                "preference_id": pref_id,
                "day_of_week": w["day"],
                "start_time": w["start"],
                "end_time": w["end"],
            }
        )
    s, b = rest_insert(url, key, bearer, "schedule_preference_windows", win_rows)
    if s not in (200, 201):
        raise RuntimeError(f"Failed to add windows: {s} {b}")

    # Focus areas
    s, b = rest_insert(
        url,
        key,
        bearer,
        "schedule_preference_focus",
        [{"preference_id": pref_id, "focus_area": f} for f in FOCUS_AREAS],
    )
    if s not in (200, 201):
        raise RuntimeError(f"Failed to add focus areas: {s} {b}")

    # Skill levels
    s, b = rest_insert(
        url,
        key,
        bearer,
        "schedule_preference_levels",
        [{"preference_id": pref_id, "level": lv} for lv in SKILL_LEVELS],
    )
    if s not in (200, 201):
        raise RuntimeError(f"Failed to add levels: {s} {b}")

    # Roles (flexible)
    s, b = rest_insert(
        url,
        key,
        bearer,
        "schedule_preference_roles",
        [{"preference_id": pref_id, "role": r} for r in ["LEAD", "FOLLOW"]],
    )
    if s not in (200, 201):
        raise RuntimeError(f"Failed to add roles: {s} {b}")

    return pref_id


def verify_created(url: str, key: str, profile_emails: list[str]) -> Dict[str, Any]:
    """
    Verify via REST that profiles and preferences exist.
    Uses service role key for convenience (read-only here).
    """
    # Profiles
    emails_csv = ",".join(profile_emails)
    s1, profiles = rest_get(
        url, key, key, "user_profiles", {"select": "id,email,first_name,last_name,auth_user_id", "email": f"in.({emails_csv})"}
    )
    # Preferences count
    pref_map = {}
    if s1 == 200 and isinstance(profiles, list):
        for p in profiles:
            pid = p["id"]
            s2, prefs = rest_get(
                url,
                key,
                key,
                "schedule_preferences",
                {"select": "id", "user_id": f"eq.{pid}"},
            )
            if s2 == 200 and isinstance(prefs, list) and prefs:
                pref_id = prefs[0]["id"]
                s3, wins = rest_get(
                    url,
                    key,
                    key,
                    "schedule_preference_windows",
                    {"select": "day_of_week,start_time,end_time", "preference_id": f"eq.{pref_id}"},
                )
                pref_map[p["email"]] = {
                    "profile_id": pid,
                    "windows": wins if isinstance(wins, list) else [],
                }
    return {
        "profiles": profiles if isinstance(profiles, list) else [],
        "preferences": pref_map,
    }


def main() -> int:
    base_url, anon_key, service_key = resolve_config()

    print("=" * 60)
    print("Seeding via Supabase APIs")
    print("=" * 60)
    print(f"API: {base_url}")

    # Shared location (use service key)
    print("\nCreating/verifying shared location...")
    location_id = create_or_get_location(base_url, service_key)
    print(f"  ✓ Location ID: {location_id}")

    results = []
    for user in USERS:
        email = user["email"]
        password = user["password"]
        print(f"\nUser: {email}")

        access_token = None
        user_id = None

        # Try signup, then signin fallback
        tok, uid = signup(base_url, anon_key, email, password)
        if tok and uid:
            access_token, user_id = tok, uid
            print("  ✓ Signed up")
        else:
            tok, uid = signin(base_url, anon_key, email, password)
            access_token, user_id = tok, uid
            print("  ✓ Signed in (existing user)")

        # Create/Upsert profile (using service key to avoid RLS/return issues)
        profile_id = create_or_upsert_profile(base_url, service_key, service_key, user_id, user)
        print(f"  ✓ Profile ID: {profile_id}")

        # Ensure roles (service key)
        ensure_roles(base_url, service_key, service_key, profile_id, user.get("roles", ["DANCER"]))
        print(f"  ✓ Roles: {', '.join(user.get('roles', ['DANCER']))}")

        # Schedule prefs and windows (service key)
        pref_id = create_schedule_preferences(
            base_url,
            service_key,
            service_key,
            profile_id,
            location_id,
            AVAILABILITY[user["availability_key"]],
        )
        print(f"  ✓ Schedule preference ID: {pref_id}")

        results.append(
            {
                "email": email,
                "user_id": user_id,
                "profile_id": profile_id,
            }
        )

    # Verify via REST (service key)
    print("\nVerifying via REST...")
    verification = verify_created(base_url, service_key, [u["email"] for u in USERS])
    profiles = verification["profiles"]
    print(f"  Profiles found: {len(profiles)}")
    for p in profiles:
        print(f"   - {p['email']} (profile_id={p['id']})")
    prefs = verification["preferences"]
    for email, info in prefs.items():
        print(f"   - {email}: {len(info.get('windows', []))} windows")

    print("\n✅ Done.")
    print("Overlapping availability times:")
    print(" - Tuesday 18:00-21:00")
    print(" - Thursday 18:00-21:00")
    print(" - Saturday 10:00-14:00")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)


