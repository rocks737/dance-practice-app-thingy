package com.dancepractice.app.service.dto;

import com.dancepractice.app.domain.common.AccountStatus;
import com.dancepractice.app.domain.common.PrimaryRole;
import com.dancepractice.app.domain.common.UserRole;
import com.dancepractice.app.domain.common.WsdcSkillLevel;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

public record UserRequest(
    @NotBlank String firstName,
    @NotBlank String lastName,
    String displayName,
    @Email @NotBlank String email,
    String bio,
    String danceGoals,
    LocalDate birthDate,
    boolean profileVisible,
    @NotNull PrimaryRole primaryRole,
    @NotNull WsdcSkillLevel wsdcSkillLevel,
    @NotNull AccountStatus accountStatus,
    @Min(1) @Max(5) @NotNull Integer competitivenessLevel,
    @NotEmpty Set<UserRole> roles,
    UUID homeLocationId,
    Set<String> notificationChannels) {}
