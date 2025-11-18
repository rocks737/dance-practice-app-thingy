package com.dancepractice.app.common.exception;

public class DomainValidationException extends RuntimeException {

  public DomainValidationException(String message) {
    this(message, null);
  }

  public DomainValidationException(String message, Throwable cause) {
    super(message, cause);
  }
}
