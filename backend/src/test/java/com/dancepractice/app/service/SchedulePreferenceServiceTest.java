package com.dancepractice.app.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.dancepractice.app.common.exception.DomainValidationException;
import com.dancepractice.app.domain.location.LocationRepository;
import com.dancepractice.app.domain.schedule.SchedulePreferenceRepository;
import com.dancepractice.app.domain.user.User;
import com.dancepractice.app.domain.user.UserRepository;
import com.dancepractice.app.service.dto.AvailabilityWindowRequest;
import com.dancepractice.app.service.dto.SchedulePreferenceRequest;
import com.dancepractice.app.service.mapper.AvailabilityWindowMapper;
import com.dancepractice.app.service.mapper.SchedulePreferenceMapper;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SchedulePreferenceServiceTest {

  @Mock private SchedulePreferenceRepository schedulePreferenceRepository;

  @Mock private UserRepository userRepository;

  @Mock private LocationRepository locationRepository;

  private SchedulePreferenceService schedulePreferenceService;

  @BeforeEach
  void init() {
    schedulePreferenceService =
        new SchedulePreferenceService(
            schedulePreferenceRepository,
            userRepository,
            locationRepository,
            Mappers.getMapper(SchedulePreferenceMapper.class),
            Mappers.getMapper(AvailabilityWindowMapper.class));
  }

  @Test
  void createThrowsWhenWindowInvalid() {
    UUID userId = UUID.randomUUID();
    when(userRepository.findById(userId)).thenReturn(Optional.of(new User()));
    SchedulePreferenceRequest request =
        new SchedulePreferenceRequest(
            null,
            null,
            null,
            null,
            null,
            null,
            List.of(
                new AvailabilityWindowRequest(
                    DayOfWeek.MONDAY, LocalTime.NOON, LocalTime.NOON.minusHours(1))),
            null);

    assertThatThrownBy(() -> schedulePreferenceService.create(userId, request))
        .isInstanceOf(DomainValidationException.class);
  }
}
