package com.dancepractice.app.service.mapper;

import com.dancepractice.app.domain.session.Session;
import com.dancepractice.app.domain.user.User;
import com.dancepractice.app.service.dto.SessionDto;
import com.dancepractice.app.service.dto.UserSummaryDto;
import java.util.LinkedHashSet;
import java.util.Set;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(
    componentModel = "spring",
    uses = {UserMapper.class, LocationMapper.class},
    unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SessionMapper {

  @Mapping(target = "organizer", source = "organizer")
  @Mapping(
      target = "participants",
      expression = "java(toParticipantSummaries(session.getParticipants()))")
  SessionDto toDto(Session session);

  default Set<UserSummaryDto> toParticipantSummaries(Set<User> participants) {
    Set<UserSummaryDto> summaries = new LinkedHashSet<>();
    if (participants == null) {
      return summaries;
    }
    for (User participant : participants) {
      summaries.add(
          new UserSummaryDto(
              participant.getId(),
              participant.getDisplayName(),
              participant.getPrimaryRole(),
              participant.getWsdcSkillLevel()));
    }
    return summaries;
  }
}
