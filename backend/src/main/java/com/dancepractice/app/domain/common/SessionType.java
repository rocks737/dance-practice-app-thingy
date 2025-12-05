package com.dancepractice.app.domain.common;

// NOTE: Reference-only enum used for Supabase schema modeling; no Spring Boot backend exists.

public enum SessionType {
  PARTNER_PRACTICE,
  GROUP_PRACTICE,
  PRIVATE_WITH_INSTRUCTOR,
  CLASS
}
