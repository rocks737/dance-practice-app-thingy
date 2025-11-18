package com.dancepractice.app.web.controller;

import com.dancepractice.app.service.UserService;
import com.dancepractice.app.service.dto.UserDto;
import com.dancepractice.app.service.dto.UserRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/users")
public class UserController {

  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  @GetMapping
  public List<UserDto> list() {
    return userService.list();
  }

  @GetMapping("/{userId}")
  public UserDto get(@PathVariable UUID userId) {
    return userService.get(userId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public UserDto create(@Valid @RequestBody UserRequest request) {
    return userService.create(request);
  }

  @PutMapping("/{userId}")
  public UserDto update(@PathVariable UUID userId, @Valid @RequestBody UserRequest request) {
    return userService.update(userId, request);
  }

  @DeleteMapping("/{userId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID userId) {
    userService.delete(userId);
  }
}
