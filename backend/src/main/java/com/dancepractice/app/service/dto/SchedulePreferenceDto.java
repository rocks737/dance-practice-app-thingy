package com.dancepractice.app.service.dto;

import com.dancepractice.app.domain.common.FocusArea;
import com.dancepractice.app.domain.common.PrimaryRole;
import com.dancepractice.app.domain.common.WsdcSkillLevel;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record SchedulePreferenceDto(
    UUID id,
    UUID userId,
    String locationNote,
    Integer maxTravelDistanceKm,
    Set<LocationSummaryDto> preferredLocations,
    Set<AvailabilityWindowDto> availabilityWindows,
    Set<PrimaryRole> preferredRoles,
    Set<WsdcSkillLevel> preferredLevels,
    Set<FocusArea> preferredFocusAreas,
    String notes,
    Instant createdAt,
    Instant updatedAt) {}
