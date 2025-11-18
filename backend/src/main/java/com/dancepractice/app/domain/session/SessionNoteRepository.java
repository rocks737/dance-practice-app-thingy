package com.dancepractice.app.domain.session;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SessionNoteRepository extends JpaRepository<SessionNote, UUID> {

  List<SessionNote> findBySessionId(UUID sessionId);
}
