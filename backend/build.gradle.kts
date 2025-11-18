plugins {
  id("org.springframework.boot") version "3.3.1"
  id("io.spring.dependency-management") version "1.1.5"
  java
  id("com.diffplug.spotless") version "6.25.0"
}

group = "com.dancepractice"

version = "0.0.1-SNAPSHOT"

java { toolchain { languageVersion.set(JavaLanguageVersion.of(21)) } }

repositories { mavenCentral() }

configurations { compileOnly { extendsFrom(configurations.annotationProcessor.get()) } }

dependencies {
  implementation("org.springframework.boot:spring-boot-starter-web")
  implementation("org.springframework.boot:spring-boot-starter-data-jpa")
  implementation("org.springframework.boot:spring-boot-starter-validation")
  implementation("org.springframework.boot:spring-boot-starter-actuator")
  implementation("org.flywaydb:flyway-core")
  implementation("org.mapstruct:mapstruct:1.5.5.Final")

  runtimeOnly("org.postgresql:postgresql")

  compileOnly("org.projectlombok:lombok")
  annotationProcessor("org.projectlombok:lombok")
  annotationProcessor("org.mapstruct:mapstruct-processor:1.5.5.Final")

  testImplementation("org.springframework.boot:spring-boot-starter-test")
  testImplementation("org.testcontainers:junit-jupiter")
  testImplementation("org.testcontainers:postgresql")
  testAnnotationProcessor("org.mapstruct:mapstruct-processor:1.5.5.Final")
}

tasks.withType<Test> { useJUnitPlatform() }

spotless {
  java {
    target("src/**/*.java")
    toggleOffOn()
    googleJavaFormat("1.21.0")
    formatAnnotations()
  }
  kotlinGradle {
    target("*.kts")
    ktfmt().googleStyle()
  }
}
