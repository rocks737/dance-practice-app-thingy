package com.dancepractice.app.service;

import com.dancepractice.app.common.exception.ResourceNotFoundException;
import com.dancepractice.app.domain.session.Session;
import com.dancepractice.app.domain.session.SessionNote;
import com.dancepractice.app.domain.session.SessionNoteRepository;
import com.dancepractice.app.domain.session.SessionRepository;
import com.dancepractice.app.domain.user.User;
import com.dancepractice.app.domain.user.UserRepository;
import com.dancepractice.app.service.dto.SessionNoteDto;
import com.dancepractice.app.service.dto.SessionNoteRequest;
import com.dancepractice.app.service.mapper.SessionNoteMapper;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SessionNoteService {

  private final SessionNoteRepository sessionNoteRepository;
  private final SessionRepository sessionRepository;
  private final UserRepository userRepository;
  private final SessionNoteMapper sessionNoteMapper;

  public SessionNoteService(
      SessionNoteRepository sessionNoteRepository,
      SessionRepository sessionRepository,
      UserRepository userRepository,
      SessionNoteMapper sessionNoteMapper) {
    this.sessionNoteRepository = sessionNoteRepository;
    this.sessionRepository = sessionRepository;
    this.userRepository = userRepository;
    this.sessionNoteMapper = sessionNoteMapper;
  }

  public SessionNoteDto add(SessionNoteRequest request) {
    Session session = getSession(request.sessionId());
    User author = getUser(request.authorId());

    SessionNote note = new SessionNote();
    note.setSession(session);
    note.setAuthor(author);
    note.setContent(request.content());
    note.setVisibility(request.visibility());
    note.setTags(request.tags() == null ? Set.of() : new LinkedHashSet<>(request.tags()));

    return sessionNoteMapper.toDto(sessionNoteRepository.save(note));
  }

  @Transactional(readOnly = true)
  public List<SessionNoteDto> listBySession(UUID sessionId) {
    return sessionNoteRepository.findBySessionId(sessionId).stream()
        .map(sessionNoteMapper::toDto)
        .toList();
  }

  private Session getSession(UUID sessionId) {
    return sessionRepository
        .findById(sessionId)
        .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
  }

  private User getUser(UUID userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
  }
}
