package com.dancepractice.app.domain.schedule;

// NOTE: Reference-only entity retained solely to describe the Supabase schema (no Spring Boot backend).

import com.dancepractice.app.common.persistence.AbstractAuditableEntity;
import com.dancepractice.app.domain.common.FocusArea;
import com.dancepractice.app.domain.common.PrimaryRole;
import com.dancepractice.app.domain.common.WsdcSkillLevel;
import com.dancepractice.app.domain.location.Location;
import com.dancepractice.app.domain.user.User;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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
@Table(name = "schedule_preferences")
@SQLDelete(
    sql =
        "UPDATE schedule_preferences SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
public class SchedulePreference extends AbstractAuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
      name = "user_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_schedule_preferences_user"))
  private User user;

  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "schedule_preference_locations",
      joinColumns =
          @JoinColumn(
              name = "preference_id",
              foreignKey = @ForeignKey(name = "fk_sched_pref_locations_preference")),
      inverseJoinColumns =
          @JoinColumn(
              name = "location_id",
              foreignKey = @ForeignKey(name = "fk_sched_pref_locations_location")))
  private Set<Location> preferredLocations = new LinkedHashSet<>();

  @Column(name = "location_note", length = 255)
  private String locationNote;

  @Column(name = "max_travel_distance_km")
  private Integer maxTravelDistanceKm;

  @ElementCollection
  @CollectionTable(
      name = "schedule_preference_windows",
      joinColumns = @JoinColumn(name = "preference_id"),
      foreignKey = @ForeignKey(name = "fk_sched_pref_windows_preference"))
  private Set<AvailabilityWindow> availabilityWindows = new LinkedHashSet<>();

  @ElementCollection
  @CollectionTable(
      name = "schedule_preference_roles",
      joinColumns = @JoinColumn(name = "preference_id"),
      foreignKey = @ForeignKey(name = "fk_sched_pref_roles_preference"))
  @Column(name = "role", length = 16)
  @Enumerated(EnumType.STRING)
  private Set<PrimaryRole> preferredRoles = new LinkedHashSet<>();

  @ElementCollection
  @CollectionTable(
      name = "schedule_preference_levels",
      joinColumns = @JoinColumn(name = "preference_id"),
      foreignKey = @ForeignKey(name = "fk_sched_pref_levels_preference"))
  @Column(name = "level", length = 32)
  @Enumerated(EnumType.STRING)
  private Set<WsdcSkillLevel> preferredLevels = new LinkedHashSet<>();

  @ElementCollection
  @CollectionTable(
      name = "schedule_preference_focus",
      joinColumns = @JoinColumn(name = "preference_id"),
      foreignKey = @ForeignKey(name = "fk_sched_pref_focus_preference"))
  @Column(name = "focus_area", length = 64)
  @Enumerated(EnumType.STRING)
  private Set<FocusArea> preferredFocusAreas = new LinkedHashSet<>();

  @Column(name = "notes", length = 1000)
  private String notes;
}
