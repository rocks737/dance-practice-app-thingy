package com.dancepractice.app.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.dancepractice.app.common.exception.DomainValidationException;
import com.dancepractice.app.domain.location.LocationRepository;
import com.dancepractice.app.domain.session.SessionRepository;
import com.dancepractice.app.domain.user.UserRepository;
import com.dancepractice.app.service.dto.SessionRequest;
import com.dancepractice.app.service.mapper.SessionMapper;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

  @Mock private SessionRepository sessionRepository;

  @Mock private UserRepository userRepository;

  @Mock private LocationRepository locationRepository;

  private SessionService sessionService;

  @BeforeEach
  void setup() {
    sessionService =
        new SessionService(
            sessionRepository,
            userRepository,
            locationRepository,
            Mappers.getMapper(SessionMapper.class));
  }

  @Test
  void createValidatesSchedule() {
    UUID organizerId = UUID.randomUUID();
    SessionRequest request =
        new SessionRequest(
            "Practice",
            com.dancepractice.app.domain.common.SessionType.PARTNER_PRACTICE,
            null,
            Instant.parse("2024-01-01T10:00:00Z"),
            Instant.parse("2024-01-01T09:00:00Z"),
            null,
            com.dancepractice.app.domain.common.Visibility.PUBLIC,
            organizerId,
            null,
            null,
            null);

    assertThatThrownBy(() -> sessionService.create(request))
        .isInstanceOf(DomainValidationException.class);
  }
}
