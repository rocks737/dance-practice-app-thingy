package com.dancepractice.app.web.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.dancepractice.app.domain.common.AccountStatus;
import com.dancepractice.app.domain.common.FocusArea;
import com.dancepractice.app.domain.common.PrimaryRole;
import com.dancepractice.app.domain.common.SessionType;
import com.dancepractice.app.domain.common.UserRole;
import com.dancepractice.app.domain.common.Visibility;
import com.dancepractice.app.domain.common.WsdcSkillLevel;
import com.dancepractice.app.domain.user.User;
import com.dancepractice.app.web.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class SessionControllerIntegrationTest extends AbstractIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Autowired private com.dancepractice.app.domain.session.SessionRepository sessionRepository;

  @Autowired private com.dancepractice.app.domain.user.UserRepository userRepository;

  private UUID organizerId;

  @BeforeEach
  void setupOrganizer() {
    User user = new User();
    user.setFirstName("Avery");
    user.setLastName("Lee");
    user.setEmail(UUID.randomUUID() + "@example.com");
    user.setPrimaryRole(PrimaryRole.LEAD);
    user.setWsdcSkillLevel(WsdcSkillLevel.NOVICE);
    user.setAccountStatus(AccountStatus.ACTIVE);
    user.setCompetitivenessLevel(2);
    user.setRoles(new java.util.LinkedHashSet<>(java.util.Set.of(UserRole.DANCER)));
    user.setNotificationChannels(new java.util.LinkedHashSet<>());
    organizerId = userRepository.save(user).getId();
  }

  @AfterEach
  void cleanup() {
    sessionRepository.deleteAll();
    userRepository.deleteAll();
  }

  @Test
  void createAndQuerySessions() throws Exception {
    var payload = objectMapper.createObjectNode();
    payload.put("title", "Morning Practice");
    payload.put("sessionType", SessionType.PARTNER_PRACTICE.name());
    Instant start = Instant.now().plusSeconds(3600);
    payload.put("scheduledStart", start.toString());
    payload.put("scheduledEnd", start.plusSeconds(3600).toString());
    payload.put("capacity", 4);
    payload.put("visibility", Visibility.PUBLIC.name());
    payload.put("organizerId", organizerId.toString());
    payload.putArray("focusAreas").add(FocusArea.CONNECTION.name());
    payload.putArray("participantIds");

    MvcResult createResult =
        mockMvc
            .perform(
                post("/api/sessions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(payload)))
            .andReturn();

    String createBody = createResult.getResponse().getContentAsString();
    assertThat(createResult.getResponse().getStatus())
        .withFailMessage(createBody)
        .isEqualTo(HttpStatus.CREATED.value());

    JsonNode node = objectMapper.readTree(createBody);
    assertThat(node.get("title").textValue()).isEqualTo("Morning Practice");
    String sessionId = node.get("id").textValue();
    assertThat(sessionId).isNotBlank();

    MvcResult listResult =
        mockMvc.perform(get("/api/sessions").param("organizerId", organizerId.toString())).andReturn();
    assertThat(listResult.getResponse().getStatus())
        .withFailMessage(listResult.getResponse().getContentAsString())
        .isEqualTo(HttpStatus.OK.value());
    JsonNode list = objectMapper.readTree(listResult.getResponse().getContentAsString());
    assertThat(list).hasSize(1);
  }
}
