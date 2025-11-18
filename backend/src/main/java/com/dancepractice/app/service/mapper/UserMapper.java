package com.dancepractice.app.service.mapper;

import com.dancepractice.app.domain.schedule.SchedulePreference;
import com.dancepractice.app.domain.user.User;
import com.dancepractice.app.service.dto.UserDto;
import com.dancepractice.app.service.dto.UserSummaryDto;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(
    componentModel = "spring",
    uses = {LocationMapper.class},
    unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

  @Mapping(
      target = "schedulePreferenceIds",
      expression = "java(mapSchedulePreferenceIds(user.getSchedulePreferences()))")
  UserDto toDto(User user);

  UserSummaryDto toSummary(User user);

  default Set<UUID> mapSchedulePreferenceIds(Set<SchedulePreference> preferences) {
    if (preferences == null || preferences.isEmpty()) {
      return Collections.emptySet();
    }
    return preferences.stream()
        .map(SchedulePreference::getId)
        .collect(Collectors.toCollection(LinkedHashSet::new));
  }
}
