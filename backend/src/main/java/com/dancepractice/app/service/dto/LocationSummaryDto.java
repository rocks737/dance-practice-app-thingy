package com.dancepractice.app.service.dto;

import com.dancepractice.app.domain.common.LocationType;
import java.util.UUID;

public record LocationSummaryDto(
    UUID id, String name, String city, String state, String country, LocationType locationType) {}
