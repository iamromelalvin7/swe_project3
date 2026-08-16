package com.archive233.backend.catalog;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SizeOptionRepository extends JpaRepository<SizeOption, UUID> {

    List<SizeOption> findBySizeGroupOrderByPositionAsc(SizeGroup sizeGroup);
}
