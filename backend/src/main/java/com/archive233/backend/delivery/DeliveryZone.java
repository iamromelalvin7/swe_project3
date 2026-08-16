package com.archive233.backend.delivery;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "delivery_zones")
public class DeliveryZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "fee_pesewas", nullable = false)
    private int feePesewas;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private int position;

    protected DeliveryZone() {
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getFeePesewas() {
        return feePesewas;
    }

    public boolean isActive() {
        return active;
    }

    public int getPosition() {
        return position;
    }
}
