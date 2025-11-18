package com.dancepractice.app.domain.schedule;

import static org.assertj.core.api.Assertions.assertThat;

import com.dancepractice.app.config.PersistenceConfig;
import com.dancepractice.app.domain.common.PrimaryRole;
import com.dancepractice.app.domain.common.UserRole;
import com.dancepractice.app.domain.common.WsdcSkillLevel;
import com.dancepractice.app.domain.user.User;
import jakarta.persistence.EntityManager;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest
@Import(PersistenceConfig.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class SchedulePreferenceRepositoryTest {

  @Container
  static final PostgreSQLContainer<?> postgres =
      new PostgreSQLContainer<>("postgres:16-alpine")
          .withDatabaseName("dance_practice_test")
          .withUsername("dance")
          .withPassword("dance");

  @DynamicPropertySource
  static void overrideProps(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
    registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
  }

  @Autowired private SchedulePreferenceRepository schedulePreferenceRepository;

  @Autowired private EntityManager entityManager;

  @Test
  void findByUserIdOmitsSoftDeletedRecords() {
    User user = createUser();
    SchedulePreference activePreference = createPreference(user);
    SchedulePreference deletedPreference = createPreference(user);

    schedulePreferenceRepository.save(activePreference);
    schedulePreferenceRepository.save(deletedPreference);
    schedulePreferenceRepository.delete(deletedPreference);

    List<SchedulePreference> results = schedulePreferenceRepository.findByUserId(user.getId());

    assertThat(results)
        .hasSize(1)
        .first()
        .extracting(SchedulePreference::getId)
        .isEqualTo(activePreference.getId());
  }

  private User createUser() {
    User user = new User();
    user.setFirstName("Sam");
    user.setLastName("Taylor");
    user.setEmail("sam@example.com");
    user.setPrimaryRole(PrimaryRole.LEAD);
    user.setWsdcSkillLevel(WsdcSkillLevel.NOVICE);
    user.setAccountStatus(com.dancepractice.app.domain.common.AccountStatus.ACTIVE);
    user.setCompetitivenessLevel(3);
    user.setRoles(new LinkedHashSet<>(Set.of(UserRole.DANCER)));
    user.setNotificationChannels(new LinkedHashSet<>());
    entityManager.persist(user);
    return user;
  }

  private SchedulePreference createPreference(User user) {
    SchedulePreference preference = new SchedulePreference();
    preference.setUser(user);
    preference.setLocationNote("Studio");
    preference.setPreferredRoles(new LinkedHashSet<>(Set.of(PrimaryRole.LEAD)));
    preference.setPreferredLevels(new LinkedHashSet<>(Set.of(WsdcSkillLevel.NOVICE)));
    preference.setPreferredFocusAreas(new LinkedHashSet<>());
    preference.setPreferredLocations(new LinkedHashSet<>());
    preference.setAvailabilityWindows(new LinkedHashSet<>(Set.of(createWindow())));
    preference.setNotes("Notes");
    return preference;
  }

  private AvailabilityWindow createWindow() {
    AvailabilityWindow window = new AvailabilityWindow();
    window.setDayOfWeek(DayOfWeek.MONDAY);
    window.setStartTime(LocalTime.of(18, 0));
    window.setEndTime(LocalTime.of(20, 0));
    return window;
  }
}
