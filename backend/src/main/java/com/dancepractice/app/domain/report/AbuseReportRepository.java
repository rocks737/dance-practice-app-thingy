package com.dancepractice.app.domain.report;

import com.dancepractice.app.domain.common.AbuseReportStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AbuseReportRepository extends JpaRepository<AbuseReport, UUID> {

  List<AbuseReport> findByStatus(AbuseReportStatus status);
}
