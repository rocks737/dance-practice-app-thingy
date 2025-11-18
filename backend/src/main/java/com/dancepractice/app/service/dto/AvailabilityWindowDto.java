package com.dancepractice.app.service.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record AvailabilityWindowDto(DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime) {}
