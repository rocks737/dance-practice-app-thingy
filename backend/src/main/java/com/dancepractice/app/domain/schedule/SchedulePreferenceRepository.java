package com.dancepractice.app.domain.schedule;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SchedulePreferenceRepository extends JpaRepository<SchedulePreference, UUID> {

  List<SchedulePreference> findByUserId(UUID userId);
}
