package com.dancepractice.app.common.exception;

public class ResourceNotFoundException extends RuntimeException {

  public ResourceNotFoundException(String message) {
    this(message, null);
  }

  public ResourceNotFoundException(String message, Throwable cause) {
    super(message, cause);
  }
}
