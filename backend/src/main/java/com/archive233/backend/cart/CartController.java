package com.archive233.backend.cart;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.archive233.backend.cart.dto.AddCartItemRequest;
import com.archive233.backend.cart.dto.CartLineDto;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public List<CartLineDto> getCart(@AuthenticationPrincipal UUID userId) {
        return cartService.getCart(userId);
    }

    @PostMapping("/items")
    public ResponseEntity<List<CartLineDto>> addItem(@AuthenticationPrincipal UUID userId,
                                                       @Valid @RequestBody AddCartItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(cartService.addItem(userId, request.productId(), request.quantity()));
    }

    @DeleteMapping("/items/{productId}")
    public List<CartLineDto> removeItem(@AuthenticationPrincipal UUID userId, @PathVariable UUID productId) {
        return cartService.removeItem(userId, productId);
    }
}
