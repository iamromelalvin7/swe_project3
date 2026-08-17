package com.archive233.backend.user;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.archive233.backend.user.dto.UpdateProfileRequest;
import com.archive233.backend.user.dto.UserProfileDto;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public UserProfileDto get(@AuthenticationPrincipal UUID userId) {
        return userService.getProfile(userId);
    }

    @PatchMapping
    public UserProfileDto update(@AuthenticationPrincipal UUID userId, @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(userId, request);
    }
}
