package com.dancepractice.app.service.dto;

import com.dancepractice.app.domain.common.AbuseCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AbuseReportRequest(
    @NotNull UUID reporterId,
    UUID reportedUserId,
    UUID sessionId,
    @NotNull AbuseCategory category,
    @NotBlank String description) {}
