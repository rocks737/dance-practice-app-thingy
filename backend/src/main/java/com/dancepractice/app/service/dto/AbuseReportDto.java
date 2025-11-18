package com.dancepractice.app.service.dto;

import com.dancepractice.app.domain.common.AbuseCategory;
import com.dancepractice.app.domain.common.AbuseReportStatus;
import java.time.Instant;
import java.util.UUID;

public record AbuseReportDto(
    UUID id,
    AbuseCategory category,
    AbuseReportStatus status,
    String description,
    UUID reporterId,
    UUID reportedUserId,
    UUID sessionId,
    String adminNotes,
    Instant handledAt,
    Instant createdAt,
    Instant updatedAt) {}
