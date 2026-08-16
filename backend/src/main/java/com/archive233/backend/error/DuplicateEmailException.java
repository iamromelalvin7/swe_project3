package com.archive233.backend.error;

import org.springframework.http.HttpStatus;

public class DuplicateEmailException extends ApiException {

    public DuplicateEmailException(String email) {
        super(HttpStatus.CONFLICT, "DUPLICATE_EMAIL", "An account with email " + email + " already exists.");
    }
}
