package com.archive233.backend.user;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.archive233.backend.error.NotFoundException;
import com.archive233.backend.user.dto.UpdateProfileRequest;
import com.archive233.backend.user.dto.UserProfileDto;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserProfileDto getProfile(UUID userId) {
        return toDto(findUser(userId));
    }

    public UserProfileDto updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = findUser(userId);
        user.setFullName(request.fullName());
        user.setPhone(request.phone());
        user.setDefaultAddress(request.defaultAddress());
        return toDto(userRepository.save(user));
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found."));
    }

    private UserProfileDto toDto(User user) {
        return new UserProfileDto(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(),
            user.getDefaultAddress(), user.getRole());
    }
}
