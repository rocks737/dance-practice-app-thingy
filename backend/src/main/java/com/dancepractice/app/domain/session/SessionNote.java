package com.dancepractice.app.domain.session;

// NOTE: Reference-only entity mirroring Supabase tables; there is no Spring Boot backend.

import com.dancepractice.app.common.persistence.AbstractAuditableEntity;
import com.dancepractice.app.domain.common.Visibility;
import com.dancepractice.app.domain.user.User;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "session_notes")
@SQLDelete(
    sql =
        "UPDATE session_notes SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
public class SessionNote extends AbstractAuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
      name = "session_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_session_notes_session"))
  private Session session;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
      name = "author_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_session_notes_author"))
  private User author;

  @Column(name = "content", nullable = false, length = 4000)
  private String content;

  @Enumerated(EnumType.STRING)
  @Column(name = "visibility", nullable = false, length = 32)
  private Visibility visibility = Visibility.AUTHOR_ONLY;

  @ElementCollection
  @CollectionTable(
      name = "session_note_tags",
      joinColumns = @JoinColumn(name = "note_id"),
      foreignKey = @ForeignKey(name = "fk_session_note_tags_note"))
  @Column(name = "tag", length = 64)
  private Set<String> tags = new LinkedHashSet<>();

  @ElementCollection
  @CollectionTable(
      name = "session_note_media",
      joinColumns = @JoinColumn(name = "note_id"),
      foreignKey = @ForeignKey(name = "fk_session_note_media_note"))
  @Column(name = "media_url", length = 500)
  private Set<String> mediaUrls = new LinkedHashSet<>();
}
