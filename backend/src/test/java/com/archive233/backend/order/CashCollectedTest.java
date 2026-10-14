package com.archive233.backend.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Proxy;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.archive233.backend.cart.CartItemRepository;
import com.archive233.backend.catalog.ProductRepository;
import com.archive233.backend.delivery.DeliveryZoneRepository;
import com.archive233.backend.error.ApiException;
import com.archive233.backend.order.dto.OrderDetailDto;
import com.archive233.backend.user.UserRepository;

/**
 * OrderService#markCashCollected, with no database: the repositories are
 * plain JDK proxies answering only the lookups the method makes (see
 * ProductImageReplaceTest for why this suite avoids Mockito).
 */
class CashCollectedTest {

    private static final UUID ORDER_ID = UUID.randomUUID();

    private final Order order = new Order("AR-TEST0001", null, "Ama", "0240000000", "1 Test St", "Accra", 2000, 30000, 32000);

    private OrderService serviceWith(Payment payment) {
        OrderRepository orders = stub(OrderRepository.class, Map.of("findDetailById", Optional.of(order)));
        PaymentRepository payments = stub(PaymentRepository.class, Map.of("findByOrderId", Optional.ofNullable(payment)));
        return new OrderService(orders, stub(OrderStatusHistoryRepository.class, Map.of()), payments,
            stub(CartItemRepository.class, Map.of()), stub(ProductRepository.class, Map.of()),
            stub(DeliveryZoneRepository.class, Map.of()), stub(UserRepository.class, Map.of()));
    }

    @SuppressWarnings("unchecked")
    private static <T> T stub(Class<T> type, Map<String, Object> answers) {
        return (T) Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[] {type}, (proxy, method, args) -> {
            if (answers.containsKey(method.getName())) return answers.get(method.getName());
            throw new UnsupportedOperationException("Unexpected call: " + method.getName());
        });
    }

    @Test
    void marksCashOnDeliveryOrderPaid() {
        Payment payment = new Payment(order, PaymentMethod.CASH_ON_DELIVERY, null, 32000);
        order.setStatus(OrderStatus.DELIVERED);

        OrderDetailDto result = serviceWith(payment).markCashCollected(ORDER_ID);

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(result.paymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(result.paymentMethod()).isEqualTo(PaymentMethod.CASH_ON_DELIVERY);
    }

    @Test
    void markingTwiceIsHarmless() {
        Payment payment = new Payment(order, PaymentMethod.CASH_ON_DELIVERY, null, 32000);
        OrderService service = serviceWith(payment);

        service.markCashCollected(ORDER_ID);
        OrderDetailDto again = service.markCashCollected(ORDER_ID);

        assertThat(again.paymentStatus()).isEqualTo(PaymentStatus.PAID);
    }

    @Test
    void refusesPaystackPayments() {
        Payment payment = new Payment(order, PaymentMethod.PAYSTACK, "AR-TEST0001", 32000);

        assertThatThrownBy(() -> serviceWith(payment).markCashCollected(ORDER_ID))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("Paystack");
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    void refusesCancelledOrders() {
        Payment payment = new Payment(order, PaymentMethod.CASH_ON_DELIVERY, null, 32000);
        order.setStatus(OrderStatus.CANCELLED);

        assertThatThrownBy(() -> serviceWith(payment).markCashCollected(ORDER_ID))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("cancelled");
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PENDING);
    }
}
