package com.dancepractice.app.web.controller;

import com.dancepractice.app.domain.common.AbuseReportStatus;
import com.dancepractice.app.service.AbuseReportService;
import com.dancepractice.app.service.dto.AbuseReportDto;
import com.dancepractice.app.service.dto.AbuseReportRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/abuse-reports")
public class AbuseReportController {

  private final AbuseReportService abuseReportService;

  public AbuseReportController(AbuseReportService abuseReportService) {
    this.abuseReportService = abuseReportService;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public AbuseReportDto submit(@Valid @RequestBody AbuseReportRequest request) {
    return abuseReportService.submit(request);
  }

  @PatchMapping("/{reportId}/status")
  public AbuseReportDto updateStatus(
      @PathVariable UUID reportId,
      @RequestParam AbuseReportStatus status,
      @RequestParam(required = false) String adminNotes) {
    return abuseReportService.updateStatus(reportId, status, adminNotes);
  }

  @GetMapping
  public List<AbuseReportDto> listByStatus(
      @RequestParam(name = "status", defaultValue = "OPEN") AbuseReportStatus status) {
    return abuseReportService.getByStatus(status);
  }
}
