package com.dancepractice.app.domain.common;

// NOTE: Reference-only enum for Supabase schema documentation; no Java backend is running here.

public enum FocusArea {
  CONNECTION("Connection"),
  TECHNIQUE("Technique"),
  MUSICALITY("Musicality"),
  COMPETITION_PREP("Competition Prep"),
  STYLING("Styling"),
  SOCIAL_DANCING("Social Dancing"),
  CHOREOGRAPHY("Choreography"),
  MINDSET("Mindset"),
  CONDITIONING("Conditioning");

  private final String displayName;

  FocusArea(String displayName) {
    this.displayName = displayName;
  }

  public String getDisplayName() {
    return displayName;
  }
}
