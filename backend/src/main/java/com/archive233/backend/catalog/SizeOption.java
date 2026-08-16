package com.archive233.backend.catalog;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "size_options")
public class SizeOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "size_group", nullable = false)
    private SizeGroup sizeGroup;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private int position;

    protected SizeOption() {
    }

    public UUID getId() {
        return id;
    }

    public SizeGroup getSizeGroup() {
        return sizeGroup;
    }

    public String getLabel() {
        return label;
    }

    public int getPosition() {
        return position;
    }
}
