package com.dancepractice.app.domain.user;

import com.dancepractice.app.common.persistence.AbstractAuditableEntity;
import com.dancepractice.app.domain.common.AccountStatus;
import com.dancepractice.app.domain.common.PrimaryRole;
import com.dancepractice.app.domain.common.UserRole;
import com.dancepractice.app.domain.common.WsdcSkillLevel;
import com.dancepractice.app.domain.location.Location;
import com.dancepractice.app.domain.schedule.SchedulePreference;
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
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;
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
@Table(
    name = "users",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_users_email",
          columnNames = {"email"})
    })
@SQLDelete(
    sql =
        "UPDATE users SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
public class User extends AbstractAuditableEntity {

  @Column(name = "first_name", nullable = false, length = 120)
  private String firstName;

  @Column(name = "last_name", nullable = false, length = 120)
  private String lastName;

  @Column(name = "display_name", length = 160)
  private String displayName;

  @Column(name = "email", nullable = false, length = 255)
  private String email;

  @Column(name = "bio", length = 1000)
  private String bio;

  @Column(name = "dance_goals", length = 500)
  private String danceGoals;

  @Column(name = "birth_date")
  private LocalDate birthDate;

  @Column(name = "profile_visible", nullable = false)
  private boolean profileVisible = true;

  @Column(name = "primary_role", nullable = false, length = 16)
  private PrimaryRole primaryRole = PrimaryRole.LEAD;

  @Min(1)
  @Max(5)
  @Column(name = "competitiveness_level", nullable = false)
  private Integer competitivenessLevel = 3;

  @Column(name = "wsdc_level", length = 32)
  private WsdcSkillLevel wsdcSkillLevel = WsdcSkillLevel.NEWCOMER;

  @Column(name = "account_status", nullable = false, length = 32)
  private AccountStatus accountStatus = AccountStatus.ACTIVE;

  @Column(name = "oauth_subject", length = 255)
  private String oauthSubject;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "home_location_id")
  private Location homeLocation;

  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
  private Set<SchedulePreference> schedulePreferences = new LinkedHashSet<>();

  @ElementCollection(fetch = FetchType.LAZY)
  @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
  @Enumerated(EnumType.STRING)
  @Column(name = "role", length = 32, nullable = false)
  private Set<UserRole> roles = new LinkedHashSet<>(Set.of(UserRole.DANCER));

  @ManyToMany
  @JoinTable(
      name = "user_blocks",
      joinColumns = @JoinColumn(name = "user_id"),
      inverseJoinColumns = @JoinColumn(name = "blocked_user_id"))
  private Set<User> blockedUsers = new LinkedHashSet<>();

  @ElementCollection
  @JoinTable(name = "user_notification_channels", joinColumns = @JoinColumn(name = "user_id"))
  @Column(name = "channel", length = 64)
  private Set<String> notificationChannels = new LinkedHashSet<>();
}
