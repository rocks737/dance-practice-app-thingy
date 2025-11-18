package com.dancepractice.app.service.dto;

import com.dancepractice.app.domain.common.Visibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
import java.util.UUID;

public record SessionNoteRequest(
    @NotNull UUID sessionId,
    @NotNull UUID authorId,
    @NotBlank String content,
    @NotNull Visibility visibility,
    Set<String> tags) {}
