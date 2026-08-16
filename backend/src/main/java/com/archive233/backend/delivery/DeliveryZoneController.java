package com.archive233.backend.delivery;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/delivery-zones")
public class DeliveryZoneController {

    private final DeliveryZoneRepository deliveryZoneRepository;

    public DeliveryZoneController(DeliveryZoneRepository deliveryZoneRepository) {
        this.deliveryZoneRepository = deliveryZoneRepository;
    }

    @GetMapping
    public List<DeliveryZoneDto> list() {
        return deliveryZoneRepository.findByActiveTrueOrderByPositionAsc().stream()
            .map(DeliveryZoneDto::from)
            .toList();
    }
}
