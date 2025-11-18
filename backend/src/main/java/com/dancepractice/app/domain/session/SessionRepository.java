package com.dancepractice.app.domain.session;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

  @EntityGraph(attributePaths = {"organizer", "location", "participants"})
  List<Session> findByOrganizerId(UUID organizerId);

  List<Session> findByScheduledStartBetween(Instant start, Instant end);
}
