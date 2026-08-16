package com.archive233.backend.order;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.archive233.backend.cart.CartItemRepository;
import com.archive233.backend.cart.dto.CartLineDto;
import com.archive233.backend.catalog.ProductRepository;
import com.archive233.backend.common.PageResponse;
import com.archive233.backend.delivery.DeliveryZone;
import com.archive233.backend.delivery.DeliveryZoneRepository;
import com.archive233.backend.error.ApiException;
import com.archive233.backend.error.NotFoundException;
import com.archive233.backend.order.dto.AdminOrderSummaryDto;
import com.archive233.backend.order.dto.CheckoutRequest;
import com.archive233.backend.order.dto.OrderDetailDto;
import com.archive233.backend.order.dto.OrderItemDto;
import com.archive233.backend.order.dto.OrderSummaryDto;
import com.archive233.backend.user.User;
import com.archive233.backend.user.UserRepository;

@Service
public class OrderService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final String ORDER_NUMBER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
    private static final SecureRandom RANDOM = new SecureRandom();

    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED_TRANSITIONS = Map.of(
        OrderStatus.PENDING, Set.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
        OrderStatus.CONFIRMED, Set.of(OrderStatus.PACKED, OrderStatus.CANCELLED),
        OrderStatus.PACKED, Set.of(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED),
        OrderStatus.OUT_FOR_DELIVERY, Set.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED),
        OrderStatus.DELIVERED, Set.of(),
        OrderStatus.CANCELLED, Set.of()
    );

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final PaymentRepository paymentRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final DeliveryZoneRepository deliveryZoneRepository;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository, OrderStatusHistoryRepository historyRepository,
                         PaymentRepository paymentRepository, CartItemRepository cartItemRepository,
                         ProductRepository productRepository, DeliveryZoneRepository deliveryZoneRepository,
                         UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.historyRepository = historyRepository;
        this.paymentRepository = paymentRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.deliveryZoneRepository = deliveryZoneRepository;
        this.userRepository = userRepository;
    }

    /**
     * FR-E4: order creation, stock decrement, and cart clearing in one
     * transaction. Payment-provider calls happen outside this method, in
     * CheckoutService, deliberately — an HTTP call to Paystack has no
     * business holding a DB transaction open.
     */
    @Transactional
    public OrderDetailDto placeOrder(UUID userId, CheckoutRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found."));
        DeliveryZone zone = deliveryZoneRepository.findByIdAndActiveTrue(request.deliveryZoneId())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                "Delivery zone is invalid.", Map.of("deliveryZoneId", "Select a valid delivery zone")));

        List<CartLineDto> lines = cartItemRepository.findLinesForUser(userId);
        if (lines.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "CART_EMPTY", "Your cart is empty.");
        }

        OffsetDateTime now = OffsetDateTime.now();
        boolean anyExpired = lines.stream().anyMatch(l -> l.expiresAt().isBefore(now));
        if (anyExpired) {
            throw new ApiException(HttpStatus.CONFLICT, "HOLD_EXPIRED",
                "A hold has expired. Renew it before checking out.");
        }

        int subtotal = lines.stream().mapToInt(l -> l.pricePesewas() * l.quantity()).sum();
        int fee = zone.getFeePesewas();
        int total = subtotal + fee;

        Order order = new Order(generateOrderNumber(), user, request.deliveryName(), request.deliveryPhone(),
            request.deliveryAddress(), zone.getName(), fee, subtotal, total);

        for (CartLineDto line : lines) {
            int updated = productRepository.decrementStockIfAvailable(line.productId(), line.quantity());
            if (updated == 0) {
                throw new ApiException(HttpStatus.CONFLICT, "OUT_OF_STOCK",
                    "'" + line.title() + "' sold out while you were checking out.");
            }
            order.getItems().add(new OrderItem(
                order, line.productId(), line.title(), line.sizeLabel(), line.primaryImageUrl(),
                line.quantity(), line.pricePesewas()));
        }

        order = orderRepository.save(order);
        historyRepository.save(new OrderStatusHistory(order, null, OrderStatus.PENDING, userId));
        cartItemRepository.deleteAllForUser(userId);

        String reference = order.getOrderNumber();
        paymentRepository.save(new Payment(order, request.paymentMethod(),
            request.paymentMethod() == PaymentMethod.PAYSTACK ? reference : null, total));

        return toDetailDto(order);
    }

    public PageResponse<OrderSummaryDto> listForCustomer(UUID userId, int page, Integer pageSize) {
        int size = pageSize == null ? DEFAULT_PAGE_SIZE : Math.min(pageSize, MAX_PAGE_SIZE);
        Page<OrderSummaryDto> orders = orderRepository.findSummariesForUser(userId,
            PageRequest.of(Math.max(page, 0), size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return PageResponse.of(orders);
    }

    public OrderDetailDto getForCustomer(UUID userId, UUID orderId) {
        Order order = orderRepository.findDetailById(orderId).orElseThrow(() -> new NotFoundException("Order not found."));
        if (!order.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "This order does not belong to you.");
        }
        return toDetailDto(order);
    }

    @Transactional
    public OrderDetailDto cancel(UUID userId, UUID orderId) {
        Order order = orderRepository.findDetailById(orderId).orElseThrow(() -> new NotFoundException("Order not found."));
        if (!order.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "This order does not belong to you.");
        }
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new ApiException(HttpStatus.CONFLICT, "ILLEGAL_TRANSITION",
                "Only pending or confirmed orders can be cancelled.");
        }
        applyTransition(order, OrderStatus.CANCELLED, userId);
        order.getItems().forEach(item -> productRepository.incrementStock(item.getProductId(), item.getQuantity()));
        return toDetailDto(order);
    }

    public PageResponse<AdminOrderSummaryDto> listForAdmin(OrderStatus status, OffsetDateTime from, OffsetDateTime to,
                                                             int page, Integer pageSize) {
        int size = pageSize == null ? DEFAULT_PAGE_SIZE : Math.min(pageSize, MAX_PAGE_SIZE);
        Specification<Order> spec = Specification.where(OrderSpecifications.hasStatus(status))
            .and(OrderSpecifications.createdAfter(from))
            .and(OrderSpecifications.createdBefore(to));
        Page<Order> orders = orderRepository.findAll(spec,
            PageRequest.of(Math.max(page, 0), size, Sort.by(Sort.Direction.DESC, "createdAt")));

        List<UUID> orderIds = orders.getContent().stream().map(Order::getId).toList();
        Map<UUID, Long> itemCounts = orderIds.isEmpty() ? Map.of() : orderRepository.countItemsByOrderIds(orderIds).stream()
            .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));
        Map<UUID, PaymentStatus> paymentStatuses = orderIds.isEmpty() ? Map.of() : paymentRepository.findByOrderIdIn(orderIds).stream()
            .collect(Collectors.toMap(p -> p.getOrder().getId(), Payment::getStatus));

        return PageResponse.of(orders.map(o -> new AdminOrderSummaryDto(
            o.getId(), o.getOrderNumber(), o.getDeliveryName(), o.getDeliveryPhone(), o.getDeliveryZoneName(),
            itemCounts.getOrDefault(o.getId(), 0L), o.getTotalPesewas(),
            paymentStatuses.getOrDefault(o.getId(), PaymentStatus.PENDING), o.getStatus(), o.getCreatedAt())));
    }

    public OrderDetailDto getForAdmin(UUID orderId) {
        Order order = orderRepository.findDetailById(orderId).orElseThrow(() -> new NotFoundException("Order not found."));
        return toDetailDto(order);
    }

    @Transactional
    public OrderDetailDto updateStatus(UUID orderId, OrderStatus newStatus, UUID adminId) {
        Order order = orderRepository.findDetailById(orderId).orElseThrow(() -> new NotFoundException("Order not found."));
        boolean returningStock = newStatus == OrderStatus.CANCELLED
            && order.getStatus() != OrderStatus.CANCELLED && order.getStatus() != OrderStatus.DELIVERED;
        applyTransition(order, newStatus, adminId);
        if (returningStock) {
            order.getItems().forEach(item -> productRepository.incrementStock(item.getProductId(), item.getQuantity()));
        }
        return toDetailDto(order);
    }

    private void applyTransition(Order order, OrderStatus newStatus, UUID changedBy) {
        OrderStatus current = order.getStatus();
        if (!ALLOWED_TRANSITIONS.getOrDefault(current, Set.of()).contains(newStatus)) {
            throw new ApiException(HttpStatus.CONFLICT, "ILLEGAL_TRANSITION",
                "Cannot move an order from " + current + " to " + newStatus + ".");
        }
        order.setStatus(newStatus);
        historyRepository.save(new OrderStatusHistory(order, current, newStatus, changedBy));
    }

    private String generateOrderNumber() {
        for (int attempt = 0; attempt < 5; attempt++) {
            StringBuilder sb = new StringBuilder("AR-");
            for (int i = 0; i < 8; i++) {
                sb.append(ORDER_NUMBER_ALPHABET.charAt(RANDOM.nextInt(ORDER_NUMBER_ALPHABET.length())));
            }
            String candidate = sb.toString();
            if (!orderRepository.existsByOrderNumber(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not generate a unique order number.");
    }

    private OrderDetailDto toDetailDto(Order order) {
        List<OrderItemDto> items = order.getItems().stream()
            .map(i -> new OrderItemDto(i.getProductTitle(), i.getProductSize(), i.getImageUrl(), i.getQuantity(), i.getPricePesewas()))
            .toList();
        PaymentMethod method = paymentRepository.findByOrderId(order.getId())
            .map(Payment::getMethod)
            .orElse(null);
        return new OrderDetailDto(order.getId(), order.getOrderNumber(), order.getStatus(),
            order.getDeliveryName(), order.getDeliveryPhone(), order.getDeliveryAddress(), order.getDeliveryZoneName(),
            order.getDeliveryFeePesewas(), order.getSubtotalPesewas(), order.getTotalPesewas(), method, items,
            order.getCreatedAt());
    }
}
