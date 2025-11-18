package com.dancepractice.app.service;

import com.dancepractice.app.common.exception.DomainValidationException;
import com.dancepractice.app.common.exception.ResourceNotFoundException;
import com.dancepractice.app.domain.location.Location;
import com.dancepractice.app.domain.location.LocationRepository;
import com.dancepractice.app.domain.session.Session;
import com.dancepractice.app.domain.session.SessionRepository;
import com.dancepractice.app.domain.user.User;
import com.dancepractice.app.domain.user.UserRepository;
import com.dancepractice.app.service.dto.SessionDto;
import com.dancepractice.app.service.dto.SessionRequest;
import com.dancepractice.app.service.mapper.SessionMapper;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SessionService {

  private final SessionRepository sessionRepository;
  private final UserRepository userRepository;
  private final LocationRepository locationRepository;
  private final SessionMapper sessionMapper;

  public SessionService(
      SessionRepository sessionRepository,
      UserRepository userRepository,
      LocationRepository locationRepository,
      SessionMapper sessionMapper) {
    this.sessionRepository = sessionRepository;
    this.userRepository = userRepository;
    this.locationRepository = locationRepository;
    this.sessionMapper = sessionMapper;
  }

  public SessionDto create(SessionRequest request) {
    Session session = new Session();
    applyRequest(session, request);
    return sessionMapper.toDto(sessionRepository.save(session));
  }

  public SessionDto update(UUID sessionId, SessionRequest request) {
    Session session = getSessionEntity(sessionId);
    applyRequest(session, request);
    return sessionMapper.toDto(sessionRepository.save(session));
  }

  @Transactional(readOnly = true)
  public SessionDto get(UUID sessionId) {
    return sessionMapper.toDto(getSessionEntity(sessionId));
  }

  public SessionDto cancel(UUID sessionId) {
    Session session = getSessionEntity(sessionId);
    session.setStatus(com.dancepractice.app.domain.common.SessionStatus.CANCELLED);
    return sessionMapper.toDto(sessionRepository.save(session));
  }

  @Transactional(readOnly = true)
  public List<SessionDto> listByOrganizer(UUID organizerId) {
    getUser(organizerId);
    return sessionRepository.findByOrganizerId(organizerId).stream()
        .map(sessionMapper::toDto)
        .toList();
  }

  private void applyRequest(Session session, SessionRequest request) {
    validateSchedule(request.scheduledStart(), request.scheduledEnd());

    session.setTitle(request.title());
    session.setSessionType(request.sessionType());
    session.setStatus(request.status() != null ? request.status() : session.getStatus());
    if (session.getStatus() == null) {
      session.setStatus(com.dancepractice.app.domain.common.SessionStatus.PROPOSED);
    }
    session.setScheduledStart(request.scheduledStart());
    session.setScheduledEnd(request.scheduledEnd());
    session.setCapacity(request.capacity());
    session.setVisibility(request.visibility());

    User organizer = getUser(request.organizerId());
    session.setOrganizer(organizer);

    session.setLocation(resolveLocation(request.locationId()));
    session.setFocusAreas(
        request.focusAreas() == null ? Set.of() : new LinkedHashSet<>(request.focusAreas()));

    Set<User> participants = resolveUsers(request.participantIds());
    session.setParticipants(participants);
  }

  private void validateSchedule(Instant start, Instant end) {
    if (start == null || end == null || !start.isBefore(end)) {
      throw new DomainValidationException("Session end time must be after start time");
    }
  }

  private Session getSessionEntity(UUID sessionId) {
    return sessionRepository
        .findById(sessionId)
        .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
  }

  private User getUser(UUID userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
  }

  private Location resolveLocation(UUID locationId) {
    if (locationId == null) {
      return null;
    }
    return locationRepository
        .findById(locationId)
        .orElseThrow(() -> new ResourceNotFoundException("Location not found: " + locationId));
  }

  private Set<User> resolveUsers(Set<UUID> userIds) {
    if (userIds == null || userIds.isEmpty()) {
      return new LinkedHashSet<>();
    }
    List<User> users = userRepository.findAllById(userIds);
    if (users.size() != userIds.size()) {
      throw new ResourceNotFoundException("One or more participants were not found");
    }
    return new LinkedHashSet<>(users);
  }
}
