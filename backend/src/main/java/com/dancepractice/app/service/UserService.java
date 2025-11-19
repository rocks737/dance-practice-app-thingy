package com.dancepractice.app.service;

import com.dancepractice.app.common.exception.ResourceNotFoundException;
import com.dancepractice.app.domain.common.UserRole;
import com.dancepractice.app.domain.location.Location;
import com.dancepractice.app.domain.location.LocationRepository;
import com.dancepractice.app.domain.user.User;
import com.dancepractice.app.domain.user.UserRepository;
import com.dancepractice.app.service.dto.UserDto;
import com.dancepractice.app.service.dto.UserRequest;
import com.dancepractice.app.service.mapper.UserMapper;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

  private final UserRepository userRepository;
  private final LocationRepository locationRepository;
  private final UserMapper userMapper;

  public UserService(
      UserRepository userRepository, LocationRepository locationRepository, UserMapper userMapper) {
    this.userRepository = userRepository;
    this.locationRepository = locationRepository;
    this.userMapper = userMapper;
  }

  public UserDto create(UserRequest request) {
    User user = new User();
    user.setAuthUserId(request.authUserId());
    applyRequest(user, request);
    setHomeLocation(user, request.homeLocationId());
    return userMapper.toDto(userRepository.save(user));
  }

  public UserDto update(UUID userId, UserRequest request) {
    User user = getUserEntity(userId);
    if (user.getAuthUserId() == null) {
      user.setAuthUserId(request.authUserId());
    } else if (!user.getAuthUserId().equals(request.authUserId())) {
      throw new IllegalArgumentException("authUserId cannot be changed");
    }
    applyRequest(user, request);
    setHomeLocation(user, request.homeLocationId());
    return userMapper.toDto(userRepository.save(user));
  }

  @Transactional(readOnly = true)
  public UserDto get(UUID userId) {
    return userMapper.toDto(getUserEntity(userId));
  }

  public void delete(UUID userId) {
    User user = getUserEntity(userId);
    userRepository.delete(user);
  }

  @Transactional(readOnly = true)
  public List<UserDto> list() {
    return userRepository.findAll().stream().map(userMapper::toDto).toList();
  }

  private void applyRequest(User user, UserRequest request) {
    user.setFirstName(request.firstName());
    user.setLastName(request.lastName());
    user.setDisplayName(request.displayName());
    user.setEmail(request.email());
    user.setBio(request.bio());
    user.setDanceGoals(request.danceGoals());
    user.setBirthDate(request.birthDate());
    user.setProfileVisible(request.profileVisible());
    user.setPrimaryRole(request.primaryRole());
    user.setWsdcSkillLevel(request.wsdcSkillLevel());
    user.setAccountStatus(request.accountStatus());
    user.setCompetitivenessLevel(request.competitivenessLevel());

    Set<UserRole> roles =
        request.roles() == null || request.roles().isEmpty()
            ? Set.of(UserRole.DANCER)
            : new LinkedHashSet<>(request.roles());
    user.setRoles(roles);

    Set<String> channels =
        request.notificationChannels() == null
            ? Set.of()
            : new LinkedHashSet<>(request.notificationChannels());
    user.setNotificationChannels(channels);
  }

  private void setHomeLocation(User user, UUID locationId) {
    if (locationId == null) {
      user.setHomeLocation(null);
      return;
    }
    Location location =
        locationRepository
            .findById(locationId)
            .orElseThrow(() -> new ResourceNotFoundException("Location not found: " + locationId));
    user.setHomeLocation(location);
  }

  private User getUserEntity(UUID userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
  }
}
