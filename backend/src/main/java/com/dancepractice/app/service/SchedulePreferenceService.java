package com.dancepractice.app.service;

import com.dancepractice.app.common.exception.DomainValidationException;
import com.dancepractice.app.common.exception.ResourceNotFoundException;
import com.dancepractice.app.domain.location.Location;
import com.dancepractice.app.domain.location.LocationRepository;
import com.dancepractice.app.domain.schedule.AvailabilityWindow;
import com.dancepractice.app.domain.schedule.SchedulePreference;
import com.dancepractice.app.domain.schedule.SchedulePreferenceRepository;
import com.dancepractice.app.domain.user.User;
import com.dancepractice.app.domain.user.UserRepository;
import com.dancepractice.app.service.dto.AvailabilityWindowRequest;
import com.dancepractice.app.service.dto.SchedulePreferenceDto;
import com.dancepractice.app.service.dto.SchedulePreferenceRequest;
import com.dancepractice.app.service.mapper.AvailabilityWindowMapper;
import com.dancepractice.app.service.mapper.SchedulePreferenceMapper;
import jakarta.validation.Valid;
import java.time.LocalTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SchedulePreferenceService {

  private final SchedulePreferenceRepository schedulePreferenceRepository;
  private final UserRepository userRepository;
  private final LocationRepository locationRepository;
  private final SchedulePreferenceMapper schedulePreferenceMapper;
  private final AvailabilityWindowMapper availabilityWindowMapper;

  public SchedulePreferenceService(
      SchedulePreferenceRepository schedulePreferenceRepository,
      UserRepository userRepository,
      LocationRepository locationRepository,
      SchedulePreferenceMapper schedulePreferenceMapper,
      AvailabilityWindowMapper availabilityWindowMapper) {
    this.schedulePreferenceRepository = schedulePreferenceRepository;
    this.userRepository = userRepository;
    this.locationRepository = locationRepository;
    this.schedulePreferenceMapper = schedulePreferenceMapper;
    this.availabilityWindowMapper = availabilityWindowMapper;
  }

  public SchedulePreferenceDto create(UUID userId, @Valid SchedulePreferenceRequest request) {
    User user = getUser(userId);
    SchedulePreference preference = new SchedulePreference();
    preference.setUser(user);
    applyRequest(preference, request);
    return schedulePreferenceMapper.toDto(schedulePreferenceRepository.save(preference));
  }

  public SchedulePreferenceDto update(
      UUID userId, UUID preferenceId, @Valid SchedulePreferenceRequest request) {
    SchedulePreference preference = getUserPreference(userId, preferenceId);
    applyRequest(preference, request);
    return schedulePreferenceMapper.toDto(schedulePreferenceRepository.save(preference));
  }

  public void delete(UUID userId, UUID preferenceId) {
    SchedulePreference preference = getUserPreference(userId, preferenceId);
    schedulePreferenceRepository.delete(preference);
  }

  @Transactional(readOnly = true)
  public List<SchedulePreferenceDto> list(UUID userId) {
    getUser(userId); // validate user exists
    return schedulePreferenceRepository.findByUserId(userId).stream()
        .map(schedulePreferenceMapper::toDto)
        .toList();
  }

  private void applyRequest(SchedulePreference preference, SchedulePreferenceRequest request) {
    preference.setLocationNote(request.locationNote());
    preference.setMaxTravelDistanceKm(request.maxTravelDistanceKm());
    preference.setPreferredRoles(
        request.preferredRoles() == null
            ? Set.of()
            : new LinkedHashSet<>(request.preferredRoles()));
    preference.setPreferredLevels(
        request.preferredLevels() == null
            ? Set.of()
            : new LinkedHashSet<>(request.preferredLevels()));
    preference.setPreferredFocusAreas(
        request.preferredFocusAreas() == null
            ? Set.of()
            : new LinkedHashSet<>(request.preferredFocusAreas()));
    preference.setNotes(request.notes());

    Set<Location> preferredLocations = resolveLocations(request.preferredLocationIds());
    preference.setPreferredLocations(preferredLocations);

    validateWindows(request.availabilityWindows());
    Set<AvailabilityWindow> windows =
        availabilityWindowMapper.toEntitySet(request.availabilityWindows());
    preference.setAvailabilityWindows(windows);
  }

  private Set<Location> resolveLocations(Set<UUID> locationIds) {
    if (locationIds == null || locationIds.isEmpty()) {
      return new LinkedHashSet<>();
    }
    List<Location> locations = locationRepository.findAllById(locationIds);
    if (locations.size() != locationIds.size()) {
      throw new ResourceNotFoundException("One or more preferred locations were not found");
    }
    return new LinkedHashSet<>(locations);
  }

  private void validateWindows(List<AvailabilityWindowRequest> windows) {
    if (windows == null || windows.isEmpty()) {
      throw new DomainValidationException("At least one availability window is required");
    }
    for (AvailabilityWindowRequest window : windows) {
      LocalTime start = window.startTime();
      LocalTime end = window.endTime();
      if (start == null || end == null || !start.isBefore(end)) {
        throw new DomainValidationException(
            "Availability window start time must be before end time");
      }
    }
  }

  private User getUser(UUID userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
  }

  private SchedulePreference getUserPreference(UUID userId, UUID preferenceId) {
    SchedulePreference preference =
        schedulePreferenceRepository
            .findById(preferenceId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        "Schedule preference not found: " + preferenceId));
    if (!preference.getUser().getId().equals(userId)) {
      throw new DomainValidationException("Schedule preference does not belong to the user");
    }
    return preference;
  }
}
