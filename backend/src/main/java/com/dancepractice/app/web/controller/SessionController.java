package com.dancepractice.app.web.controller;

import com.dancepractice.app.service.SessionService;
import com.dancepractice.app.service.dto.SessionDto;
import com.dancepractice.app.service.dto.SessionRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/sessions")
public class SessionController {

  private final SessionService sessionService;

  public SessionController(SessionService sessionService) {
    this.sessionService = sessionService;
  }

  @GetMapping("/{sessionId}")
  public SessionDto get(@PathVariable UUID sessionId) {
    return sessionService.get(sessionId);
  }

  @GetMapping
  public List<SessionDto> listByOrganizer(@RequestParam("organizerId") UUID organizerId) {
    return sessionService.listByOrganizer(organizerId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public SessionDto create(@Valid @RequestBody SessionRequest request) {
    return sessionService.create(request);
  }

  @PutMapping("/{sessionId}")
  public SessionDto update(
      @PathVariable UUID sessionId, @Valid @RequestBody SessionRequest request) {
    return sessionService.update(sessionId, request);
  }

  @PostMapping("/{sessionId}/cancel")
  public SessionDto cancel(@PathVariable UUID sessionId) {
    return sessionService.cancel(sessionId);
  }
}
