package com.dancepractice.app.service.mapper;

import com.dancepractice.app.domain.location.Location;
import com.dancepractice.app.service.dto.LocationSummaryDto;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface LocationMapper {

  LocationSummaryDto toSummary(Location location);

  default Set<LocationSummaryDto> toSummarySet(Set<Location> locations) {
    if (locations == null || locations.isEmpty()) {
      return Collections.emptySet();
    }
    Set<LocationSummaryDto> result = new LinkedHashSet<>();
    for (Location location : locations) {
      LocationSummaryDto dto = toSummary(location);
      if (dto != null) {
        result.add(dto);
      }
    }
    return result;
  }
}
