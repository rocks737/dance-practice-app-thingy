package com.dancepractice.app.service.mapper;

import com.dancepractice.app.domain.report.AbuseReport;
import com.dancepractice.app.service.dto.AbuseReportDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AbuseReportMapper {

  @Mapping(target = "reporterId", source = "reporter.id")
  @Mapping(target = "reportedUserId", source = "reportedUser.id")
  @Mapping(target = "sessionId", source = "session.id")
  AbuseReportDto toDto(AbuseReport report);
}
