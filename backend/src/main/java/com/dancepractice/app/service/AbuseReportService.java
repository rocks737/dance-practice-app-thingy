package com.dancepractice.app.service;

import com.dancepractice.app.common.exception.ResourceNotFoundException;
import com.dancepractice.app.domain.common.AbuseReportStatus;
import com.dancepractice.app.domain.report.AbuseReport;
import com.dancepractice.app.domain.report.AbuseReportRepository;
import com.dancepractice.app.domain.session.Session;
import com.dancepractice.app.domain.session.SessionRepository;
import com.dancepractice.app.domain.user.User;
import com.dancepractice.app.domain.user.UserRepository;
import com.dancepractice.app.service.dto.AbuseReportDto;
import com.dancepractice.app.service.dto.AbuseReportRequest;
import com.dancepractice.app.service.mapper.AbuseReportMapper;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AbuseReportService {

  private final AbuseReportRepository abuseReportRepository;
  private final UserRepository userRepository;
  private final SessionRepository sessionRepository;
  private final AbuseReportMapper abuseReportMapper;

  public AbuseReportService(
      AbuseReportRepository abuseReportRepository,
      UserRepository userRepository,
      SessionRepository sessionRepository,
      AbuseReportMapper abuseReportMapper) {
    this.abuseReportRepository = abuseReportRepository;
    this.userRepository = userRepository;
    this.sessionRepository = sessionRepository;
    this.abuseReportMapper = abuseReportMapper;
  }

  public AbuseReportDto submit(AbuseReportRequest request) {
    AbuseReport report = new AbuseReport();
    report.setReporter(getUser(request.reporterId()));
    report.setReportedUser(
        request.reportedUserId() != null ? getUser(request.reportedUserId()) : null);
    report.setSession(request.sessionId() != null ? getSession(request.sessionId()) : null);
    report.setCategory(request.category());
    report.setDescription(request.description());
    report.setStatus(AbuseReportStatus.OPEN);
    return abuseReportMapper.toDto(abuseReportRepository.save(report));
  }

  public AbuseReportDto updateStatus(UUID reportId, AbuseReportStatus status, String adminNotes) {
    AbuseReport report =
        abuseReportRepository
            .findById(reportId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Abuse report not found: " + reportId));
    report.setStatus(status);
    report.setAdminNotes(adminNotes);
    report.setHandledAt(Instant.now());
    return abuseReportMapper.toDto(abuseReportRepository.save(report));
  }

  @Transactional(readOnly = true)
  public List<AbuseReportDto> getByStatus(AbuseReportStatus status) {
    return abuseReportRepository.findByStatus(status).stream()
        .map(abuseReportMapper::toDto)
        .toList();
  }

  private User getUser(UUID userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
  }

  private Session getSession(UUID sessionId) {
    return sessionRepository
        .findById(sessionId)
        .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
  }
}
