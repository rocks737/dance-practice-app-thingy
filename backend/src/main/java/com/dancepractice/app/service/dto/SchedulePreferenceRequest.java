package com.dancepractice.app.service.dto;

import com.dancepractice.app.domain.common.FocusArea;
import com.dancepractice.app.domain.common.PrimaryRole;
import com.dancepractice.app.domain.common.WsdcSkillLevel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record SchedulePreferenceRequest(
    String locationNote,
    Integer maxTravelDistanceKm,
    Set<PrimaryRole> preferredRoles,
    Set<WsdcSkillLevel> preferredLevels,
    Set<FocusArea> preferredFocusAreas,
    Set<UUID> preferredLocationIds,
    @NotNull @NotEmpty List<@Valid AvailabilityWindowRequest> availabilityWindows,
    String notes) {}
