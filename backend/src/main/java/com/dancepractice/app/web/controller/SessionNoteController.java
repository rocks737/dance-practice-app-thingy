package com.dancepractice.app.web.controller;

import com.dancepractice.app.common.exception.DomainValidationException;
import com.dancepractice.app.service.SessionNoteService;
import com.dancepractice.app.service.dto.SessionNoteDto;
import com.dancepractice.app.service.dto.SessionNoteRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/sessions/{sessionId}/notes")
public class SessionNoteController {

  private final SessionNoteService sessionNoteService;

  public SessionNoteController(SessionNoteService sessionNoteService) {
    this.sessionNoteService = sessionNoteService;
  }

  @GetMapping
  public List<SessionNoteDto> list(@PathVariable UUID sessionId) {
    return sessionNoteService.listBySession(sessionId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public SessionNoteDto create(
      @PathVariable UUID sessionId, @Valid @RequestBody SessionNoteRequest request) {
    if (!sessionId.equals(request.sessionId())) {
      throw new DomainValidationException("Session id mismatch between path and payload");
    }
    return sessionNoteService.add(request);
  }
}
