package com.archive233.backend.order;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.archive233.backend.user.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    @Column(name = "order_number", nullable = false, unique = true)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "delivery_name", nullable = false)
    private String deliveryName;

    @Column(name = "delivery_phone", nullable = false)
    private String deliveryPhone;

    @Column(name = "delivery_address", nullable = false)
    private String deliveryAddress;

    @Column(name = "delivery_zone_name", nullable = false)
    private String deliveryZoneName;

    @Column(name = "delivery_fee_pesewas", nullable = false)
    private int deliveryFeePesewas;

    @Column(name = "subtotal_pesewas", nullable = false)
    private int subtotalPesewas;

    @Column(name = "total_pesewas", nullable = false)
    private int totalPesewas;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderItem> items = new ArrayList<>();

    protected Order() {
    }

    public Order(String orderNumber, User user, String deliveryName, String deliveryPhone, String deliveryAddress,
                 String deliveryZoneName, int deliveryFeePesewas, int subtotalPesewas, int totalPesewas) {
        this.orderNumber = orderNumber;
        this.user = user;
        this.status = OrderStatus.PENDING;
        this.deliveryName = deliveryName;
        this.deliveryPhone = deliveryPhone;
        this.deliveryAddress = deliveryAddress;
        this.deliveryZoneName = deliveryZoneName;
        this.deliveryFeePesewas = deliveryFeePesewas;
        this.subtotalPesewas = subtotalPesewas;
        this.totalPesewas = totalPesewas;
    }

    public UUID getId() {
        return id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public User getUser() {
        return user;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getDeliveryName() {
        return deliveryName;
    }

    public String getDeliveryPhone() {
        return deliveryPhone;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public String getDeliveryZoneName() {
        return deliveryZoneName;
    }

    public int getDeliveryFeePesewas() {
        return deliveryFeePesewas;
    }

    public int getSubtotalPesewas() {
        return subtotalPesewas;
    }

    public int getTotalPesewas() {
        return totalPesewas;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<OrderItem> getItems() {
        return items;
    }
}
