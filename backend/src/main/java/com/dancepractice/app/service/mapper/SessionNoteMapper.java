package com.dancepractice.app.service.mapper;

import com.dancepractice.app.domain.session.SessionNote;
import com.dancepractice.app.service.dto.SessionNoteDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(
    componentModel = "spring",
    uses = {UserMapper.class},
    unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SessionNoteMapper {

  @Mapping(target = "sessionId", source = "session.id")
  SessionNoteDto toDto(SessionNote note);
}
