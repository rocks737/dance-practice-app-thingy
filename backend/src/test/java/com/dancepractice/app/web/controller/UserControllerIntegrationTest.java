package com.dancepractice.app.web.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.dancepractice.app.domain.common.AccountStatus;
import com.dancepractice.app.domain.common.PrimaryRole;
import com.dancepractice.app.domain.common.UserRole;
import com.dancepractice.app.domain.common.WsdcSkillLevel;
import com.dancepractice.app.web.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import org.junit.jupiter.api.AfterEach;
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
class UserControllerIntegrationTest extends AbstractIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Autowired private com.dancepractice.app.domain.user.UserRepository userRepository;

  @AfterEach
  void cleanup() {
    userRepository.deleteAll();
  }

  @Test
  void createAndListUsers() throws Exception {
    var payload = objectMapper.createObjectNode();
    payload.put("firstName", "Jules");
    payload.put("lastName", "Rivera");
    payload.put("displayName", "Jules R");
    payload.put("email", "jules@example.com");
    payload.put("bio", "NYC WCS dancer");
    payload.put("danceGoals", "Improve connection");
    payload.put("birthDate", LocalDate.of(1994, 5, 12).toString());
    payload.put("profileVisible", true);
    payload.put("primaryRole", PrimaryRole.LEAD.name());
    payload.put("wsdcSkillLevel", WsdcSkillLevel.NOVICE.name());
    payload.put("accountStatus", AccountStatus.ACTIVE.name());
    payload.put("competitivenessLevel", 3);
    var roles = payload.putArray("roles");
    roles.add(UserRole.DANCER.name());
    var channels = payload.putArray("notificationChannels");
    channels.add("EMAIL");

    MvcResult createResult =
        mockMvc
            .perform(
                post("/api/users")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(payload)))
            .andReturn();

    assertThat(createResult.getResponse().getStatus())
        .withFailMessage(createResult.getResponse().getContentAsString())
        .isEqualTo(HttpStatus.CREATED.value());

    JsonNode node = objectMapper.readTree(createResult.getResponse().getContentAsString());
    assertThat(node.get("id").textValue()).isNotBlank();
    assertThat(node.get("email").textValue()).isEqualTo("jules@example.com");

    MvcResult listResult = mockMvc.perform(get("/api/users")).andReturn();
    assertThat(listResult.getResponse().getStatus())
        .withFailMessage(listResult.getResponse().getContentAsString())
        .isEqualTo(HttpStatus.OK.value());

    JsonNode listNode = objectMapper.readTree(listResult.getResponse().getContentAsString());
    assertThat(listNode).hasSize(1);
  }
}
