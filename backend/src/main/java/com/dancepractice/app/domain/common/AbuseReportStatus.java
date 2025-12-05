package com.dancepractice.app.domain.common;

// NOTE: Reference-only enum documenting Supabase schema; no Spring Boot backend ships with this repo.

public enum AbuseReportStatus {
  OPEN,
  ACKNOWLEDGED,
  IN_REVIEW,
  RESOLVED,
  DISMISSED
}
