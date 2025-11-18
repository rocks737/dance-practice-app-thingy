package com.dancepractice.app.service.dto;

import com.dancepractice.app.domain.common.FocusArea;
import com.dancepractice.app.domain.common.SessionStatus;
import com.dancepractice.app.domain.common.SessionType;
import com.dancepractice.app.domain.common.Visibility;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record SessionRequest(
    @NotBlank String title,
    @NotNull SessionType sessionType,
    SessionStatus status,
    @NotNull @FutureOrPresent Instant scheduledStart,
    @NotNull Instant scheduledEnd,
    Integer capacity,
    @NotNull Visibility visibility,
    @NotNull UUID organizerId,
    UUID locationId,
    Set<FocusArea> focusAreas,
    Set<UUID> participantIds) {}
