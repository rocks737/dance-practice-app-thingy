package com.dancepractice.app.service.mapper;

import com.dancepractice.app.domain.schedule.SchedulePreference;
import com.dancepractice.app.service.dto.SchedulePreferenceDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(
    componentModel = "spring",
    uses = {LocationMapper.class, AvailabilityWindowMapper.class},
    unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SchedulePreferenceMapper {

  @Mapping(target = "userId", source = "user.id")
  SchedulePreferenceDto toDto(SchedulePreference preference);
}
