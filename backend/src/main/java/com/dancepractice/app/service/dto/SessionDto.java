package com.dancepractice.app.service.dto;

import com.dancepractice.app.domain.common.FocusArea;
import com.dancepractice.app.domain.common.SessionStatus;
import com.dancepractice.app.domain.common.SessionType;
import com.dancepractice.app.domain.common.Visibility;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record SessionDto(
    UUID id,
    String title,
    SessionType sessionType,
    SessionStatus status,
    Instant scheduledStart,
    Instant scheduledEnd,
    Integer capacity,
    Visibility visibility,
    UserSummaryDto organizer,
    LocationSummaryDto location,
    Set<FocusArea> focusAreas,
    Set<UserSummaryDto> participants,
    Instant createdAt,
    Instant updatedAt) {}
