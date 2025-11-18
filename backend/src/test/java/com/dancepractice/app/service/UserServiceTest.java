package com.dancepractice.app.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.dancepractice.app.domain.common.AccountStatus;
import com.dancepractice.app.domain.common.PrimaryRole;
import com.dancepractice.app.domain.common.UserRole;
import com.dancepractice.app.domain.common.WsdcSkillLevel;
import com.dancepractice.app.domain.location.Location;
import com.dancepractice.app.domain.location.LocationRepository;
import com.dancepractice.app.domain.user.User;
import com.dancepractice.app.domain.user.UserRepository;
import com.dancepractice.app.service.dto.UserDto;
import com.dancepractice.app.service.dto.UserRequest;
import com.dancepractice.app.service.mapper.UserMapper;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

  @Mock private UserRepository userRepository;

  @Mock private LocationRepository locationRepository;

  @Mock private UserMapper userMapper;

  @InjectMocks private UserService userService;

  private UserRequest userRequest;

  @BeforeEach
  void setUp() {
    userRequest =
        new UserRequest(
            "Alex",
            "Doe",
            "Alex D",
            "alex@example.com",
            "Bio",
            "Goals",
            LocalDate.of(1995, 1, 1),
            true,
            PrimaryRole.LEAD,
            WsdcSkillLevel.NOVICE,
            AccountStatus.ACTIVE,
            3,
            Set.of(UserRole.DANCER, UserRole.INSTRUCTOR),
            null,
            Set.of("EMAIL"));
  }

  @Test
  void createPersistsUserWithHomeLocation() {
    Location location = new Location();
    UUID locationId = UUID.randomUUID();
    userRequest =
        new UserRequest(
            userRequest.firstName(),
            userRequest.lastName(),
            userRequest.displayName(),
            userRequest.email(),
            userRequest.bio(),
            userRequest.danceGoals(),
            userRequest.birthDate(),
            userRequest.profileVisible(),
            userRequest.primaryRole(),
            userRequest.wsdcSkillLevel(),
            userRequest.accountStatus(),
            userRequest.competitivenessLevel(),
            userRequest.roles(),
            locationId,
            userRequest.notificationChannels());

    when(locationRepository.findById(locationId)).thenReturn(java.util.Optional.of(location));
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(userMapper.toDto(any(User.class)))
        .thenReturn(
            new UserDto(
                UUID.randomUUID(),
                userRequest.firstName(),
                userRequest.lastName(),
                userRequest.displayName(),
                userRequest.email(),
                userRequest.bio(),
                userRequest.danceGoals(),
                userRequest.birthDate(),
                userRequest.profileVisible(),
                userRequest.primaryRole(),
                userRequest.wsdcSkillLevel(),
                userRequest.competitivenessLevel(),
                userRequest.accountStatus(),
                userRequest.roles(),
                null,
                userRequest.notificationChannels(),
                Set.of(),
                null,
                null));

    UserDto result = userService.create(userRequest);

    assertThat(result.firstName()).isEqualTo("Alex");

    ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(userCaptor.capture());
    assertThat(userCaptor.getValue().getHomeLocation()).isEqualTo(location);
  }
}
