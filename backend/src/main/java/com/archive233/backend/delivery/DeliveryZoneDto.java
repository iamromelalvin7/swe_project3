package com.archive233.backend.delivery;

import java.util.UUID;

public record DeliveryZoneDto(UUID id, String name, int feePesewas) {

    public static DeliveryZoneDto from(DeliveryZone zone) {
        return new DeliveryZoneDto(zone.getId(), zone.getName(), zone.getFeePesewas());
    }
}
