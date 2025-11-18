package com.dancepractice.app.service.dto;

import com.dancepractice.app.domain.common.AccountStatus;
import com.dancepractice.app.domain.common.PrimaryRole;
import com.dancepractice.app.domain.common.UserRole;
import com.dancepractice.app.domain.common.WsdcSkillLevel;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

public record UserDto(
    UUID id,
    String firstName,
    String lastName,
    String displayName,
    String email,
    String bio,
    String danceGoals,
    LocalDate birthDate,
    boolean profileVisible,
    PrimaryRole primaryRole,
    WsdcSkillLevel wsdcSkillLevel,
    Integer competitivenessLevel,
    AccountStatus accountStatus,
    Set<UserRole> roles,
    LocationSummaryDto homeLocation,
    Set<String> notificationChannels,
    Set<UUID> schedulePreferenceIds,
    Instant createdAt,
    Instant updatedAt) {}
