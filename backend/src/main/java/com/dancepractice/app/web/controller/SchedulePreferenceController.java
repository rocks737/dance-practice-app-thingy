package com.dancepractice.app.web.controller;

import com.dancepractice.app.service.SchedulePreferenceService;
import com.dancepractice.app.service.dto.SchedulePreferenceDto;
import com.dancepractice.app.service.dto.SchedulePreferenceRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/users/{userId}/schedule-preferences")
public class SchedulePreferenceController {

  private final SchedulePreferenceService schedulePreferenceService;

  public SchedulePreferenceController(SchedulePreferenceService schedulePreferenceService) {
    this.schedulePreferenceService = schedulePreferenceService;
  }

  @GetMapping
  public List<SchedulePreferenceDto> list(@PathVariable UUID userId) {
    return schedulePreferenceService.list(userId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public SchedulePreferenceDto create(
      @PathVariable UUID userId, @Valid @RequestBody SchedulePreferenceRequest request) {
    return schedulePreferenceService.create(userId, request);
  }

  @PutMapping("/{preferenceId}")
  public SchedulePreferenceDto update(
      @PathVariable UUID userId,
      @PathVariable UUID preferenceId,
      @Valid @RequestBody SchedulePreferenceRequest request) {
    return schedulePreferenceService.update(userId, preferenceId, request);
  }

  @DeleteMapping("/{preferenceId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID userId, @PathVariable UUID preferenceId) {
    schedulePreferenceService.delete(userId, preferenceId);
  }
}
