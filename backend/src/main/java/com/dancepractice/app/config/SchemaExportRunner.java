package com.dancepractice.app.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
@Profile("schema-export")
public class SchemaExportRunner implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(SchemaExportRunner.class);

  private final ApplicationContext applicationContext;
  private final Environment environment;

  public SchemaExportRunner(ApplicationContext applicationContext, Environment environment) {
    this.applicationContext = applicationContext;
    this.environment = environment;
  }

  @Override
  public void run(ApplicationArguments args) throws Exception {
    String target =
        environment.getProperty(
            "jakarta.persistence.schema-generation.scripts.create-target", "build/schema.sql");
    Path targetPath = Paths.get(target);
    if (!targetPath.isAbsolute()) {
      targetPath = Paths.get("").toAbsolutePath().resolve(targetPath).normalize();
    }

    if (Files.exists(targetPath)) {
      log.info("Schema export completed: {}", targetPath);
    } else {
      log.warn("Schema export target not found: {}", targetPath);
    }

    SpringApplication.exit(applicationContext, () -> 0);
  }
}
