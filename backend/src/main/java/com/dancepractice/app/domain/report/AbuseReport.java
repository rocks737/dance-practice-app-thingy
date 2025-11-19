package com.dancepractice.app.domain.report;

import com.dancepractice.app.common.persistence.AbstractAuditableEntity;
import com.dancepractice.app.domain.common.AbuseCategory;
import com.dancepractice.app.domain.common.AbuseReportStatus;
import com.dancepractice.app.domain.session.Session;
import com.dancepractice.app.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "abuse_reports")
@SQLDelete(
    sql =
        "UPDATE abuse_reports SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
public class AbuseReport extends AbstractAuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
      name = "reporter_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_abuse_reports_reporter"))
  private User reporter;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(
      name = "reported_user_id",
      foreignKey = @ForeignKey(name = "fk_abuse_reports_reported_user"))
  private User reportedUser;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "session_id", foreignKey = @ForeignKey(name = "fk_abuse_reports_session"))
  private Session session;

  @Enumerated(EnumType.STRING)
  @Column(name = "category", nullable = false, length = 32)
  private AbuseCategory category;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 32)
  private AbuseReportStatus status = AbuseReportStatus.OPEN;

  @Column(name = "description", nullable = false, length = 2000)
  private String description;

  @Column(name = "admin_notes", length = 2000)
  private String adminNotes;

  @Column(name = "handled_at")
  private Instant handledAt;
}
