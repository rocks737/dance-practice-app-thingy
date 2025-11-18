package com.dancepractice.app.service.dto;

import com.dancepractice.app.domain.common.PrimaryRole;
import com.dancepractice.app.domain.common.WsdcSkillLevel;
import java.util.UUID;

public record UserSummaryDto(
    UUID id, String displayName, PrimaryRole primaryRole, WsdcSkillLevel wsdcSkillLevel) {}
