package com.dancepractice.app.domain.user;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

  Optional<User> findByEmailIgnoreCase(String email);

  @EntityGraph(attributePaths = {"schedulePreferences"})
  Optional<User> findWithSchedulePreferencesById(UUID id);
}
