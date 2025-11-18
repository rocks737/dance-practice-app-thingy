package com.dancepractice.app.service.dto;

import com.dancepractice.app.domain.common.Visibility;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record SessionNoteDto(
    UUID id,
    UUID sessionId,
    UserSummaryDto author,
    String content,
    Visibility visibility,
    Set<String> tags,
    Instant createdAt,
    Instant updatedAt) {}
