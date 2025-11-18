package com.dancepractice.app.domain.session;

import com.dancepractice.app.common.persistence.AbstractAuditableEntity;
import com.dancepractice.app.domain.common.FocusArea;
import com.dancepractice.app.domain.common.SessionStatus;
import com.dancepractice.app.domain.common.SessionType;
import com.dancepractice.app.domain.common.Visibility;
import com.dancepractice.app.domain.location.Location;
import com.dancepractice.app.domain.user.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "sessions")
@SQLDelete(
    sql =
        "UPDATE sessions SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
public class Session extends AbstractAuditableEntity {

  @Column(name = "title", nullable = false, length = 255)
  private String title;

  @Enumerated(EnumType.STRING)
  @Column(name = "session_type", nullable = false, length = 32)
  private SessionType sessionType;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 32)
  private SessionStatus status = SessionStatus.PROPOSED;

  @Column(name = "scheduled_start", nullable = false)
  private Instant scheduledStart;

  @Column(name = "scheduled_end", nullable = false)
  private Instant scheduledEnd;

  @Column(name = "capacity")
  private Integer capacity;

  @Enumerated(EnumType.STRING)
  @Column(name = "visibility", nullable = false, length = 32)
  private Visibility visibility = Visibility.PUBLIC;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "organizer_id", nullable = false)
  private User organizer;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "location_id")
  private Location location;

  @ManyToMany
  @JoinTable(
      name = "session_participants",
      joinColumns = @JoinColumn(name = "session_id"),
      inverseJoinColumns = @JoinColumn(name = "user_id"))
  private Set<User> participants = new LinkedHashSet<>();

  @ElementCollection
  @CollectionTable(name = "session_focus_areas", joinColumns = @JoinColumn(name = "session_id"))
  @Column(name = "focus_area", length = 64)
  @Enumerated(EnumType.STRING)
  private Set<FocusArea> focusAreas = new LinkedHashSet<>();

  @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
  private Set<SessionNote> notes = new LinkedHashSet<>();
}
