package com.dancepractice.app.domain.location;

// NOTE: Reference-only entity preserved to describe the Supabase schema; no Spring Boot backend exists.

import com.dancepractice.app.common.persistence.AbstractAuditableEntity;
import com.dancepractice.app.domain.common.LocationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "locations")
@SQLDelete(
    sql =
        "UPDATE locations SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
public class Location extends AbstractAuditableEntity {

  @Column(name = "name", nullable = false, length = 255)
  private String name;

  @Column(name = "description", length = 1000)
  private String description;

  @Column(name = "address_line1", length = 255)
  private String addressLine1;

  @Column(name = "address_line2", length = 255)
  private String addressLine2;

  @Column(name = "city", length = 120)
  private String city;

  @Column(name = "state", length = 120)
  private String state;

  @Column(name = "postal_code", length = 32)
  private String postalCode;

  @Column(name = "country", length = 120)
  private String country;

  @Column(name = "latitude")
  private Double latitude;

  @Column(name = "longitude")
  private Double longitude;

  @Column(name = "location_type", length = 32)
  private LocationType locationType = LocationType.OTHER;
}
