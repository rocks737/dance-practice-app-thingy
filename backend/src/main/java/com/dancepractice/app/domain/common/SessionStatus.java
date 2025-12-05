package com.dancepractice.app.domain.common;

// NOTE: Reference-only enum describing Supabase data; there is no Spring Boot backend in use.

public enum SessionStatus {
  PROPOSED,
  SCHEDULED,
  COMPLETED,
  CANCELLED
}
