package com.dancepractice.app.service.mapper;

import com.dancepractice.app.domain.schedule.AvailabilityWindow;
import com.dancepractice.app.service.dto.AvailabilityWindowDto;
import com.dancepractice.app.service.dto.AvailabilityWindowRequest;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AvailabilityWindowMapper {

  AvailabilityWindowDto toDto(AvailabilityWindow window);

  default Set<AvailabilityWindowDto> toDtoSet(Set<AvailabilityWindow> windows) {
    if (windows == null || windows.isEmpty()) {
      return Set.of();
    }
    Set<AvailabilityWindowDto> result = new LinkedHashSet<>();
    for (AvailabilityWindow window : windows) {
      AvailabilityWindowDto dto = toDto(window);
      if (dto != null) {
        result.add(dto);
      }
    }
    return result;
  }

  AvailabilityWindow toEntity(AvailabilityWindowRequest request);

  default Set<AvailabilityWindow> toEntitySet(List<AvailabilityWindowRequest> requests) {
    if (requests == null || requests.isEmpty()) {
      return Set.of();
    }
    Set<AvailabilityWindow> result = new LinkedHashSet<>();
    for (AvailabilityWindowRequest request : requests) {
      AvailabilityWindow window = toEntity(request);
      if (window != null) {
        result.add(window);
      }
    }
    return result;
  }
}
