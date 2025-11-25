/**
 * Runtime validation to ensure TypeScript enums match database constraints
 */

import {
  PrimaryRole,
  WsdcSkillLevel,
  AccountStatus,
  PRIMARY_ROLE_LABELS,
  WSDC_SKILL_LEVEL_LABELS,
  ACCOUNT_STATUS_LABELS,
} from "../types";

/**
 * Database constraints from schema:
 * - primary_role: smallint (0-1)
 * - wsdc_level: smallint check (wsdc_level between 0 and 5)
 * - account_status: smallint (0-2)
 */

describe("Database-TypeScript Enum Alignment", () => {
  describe("PrimaryRole enum", () => {
    it("should have values within database constraint (0-1)", () => {
      const values = Object.values(PrimaryRole).filter((v) => typeof v === "number");
      values.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });

    it("should have exactly 2 values", () => {
      const values = Object.values(PrimaryRole).filter((v) => typeof v === "number");
      expect(values).toHaveLength(2);
    });

    it("should have sequential values starting from 0", () => {
      expect(PrimaryRole.LEADER).toBe(0);
      expect(PrimaryRole.FOLLOWER).toBe(1);
    });

    it("should have labels for all enum values", () => {
      const enumValues = Object.values(PrimaryRole).filter(
        (v) => typeof v === "number",
      ) as PrimaryRole[];
      enumValues.forEach((value) => {
        expect(PRIMARY_ROLE_LABELS[value]).toBeDefined();
        expect(PRIMARY_ROLE_LABELS[value]).not.toBe("");
      });
    });
  });

  describe("WsdcSkillLevel enum", () => {
    it("should have values within database constraint (0-5)", () => {
      const values = Object.values(WsdcSkillLevel).filter((v) => typeof v === "number");
      values.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(5);
      });
    });

    it("should have exactly 6 values (matching WSDC divisions)", () => {
      const values = Object.values(WsdcSkillLevel).filter((v) => typeof v === "number");
      expect(values).toHaveLength(6);
    });

    it("should have sequential values starting from 0", () => {
      expect(WsdcSkillLevel.NEWCOMER).toBe(0);
      expect(WsdcSkillLevel.NOVICE).toBe(1);
      expect(WsdcSkillLevel.INTERMEDIATE).toBe(2);
      expect(WsdcSkillLevel.ADVANCED).toBe(3);
      expect(WsdcSkillLevel.ALLSTAR).toBe(4);
      expect(WsdcSkillLevel.CHAMPION).toBe(5);
    });

    it("should have labels for all enum values", () => {
      const enumValues = Object.values(WsdcSkillLevel).filter(
        (v) => typeof v === "number",
      ) as WsdcSkillLevel[];
      enumValues.forEach((value) => {
        expect(WSDC_SKILL_LEVEL_LABELS[value]).toBeDefined();
        expect(WSDC_SKILL_LEVEL_LABELS[value]).not.toBe("");
      });
    });

    it("should match official WSDC divisions", () => {
      const officialDivisions = [
        "Newcomer",
        "Novice",
        "Intermediate",
        "Advanced",
        "All-Star",
        "Champion",
      ];

      const enumLabels = Object.values(WsdcSkillLevel)
        .filter((v) => typeof v === "number")
        .map((v) => WSDC_SKILL_LEVEL_LABELS[v as WsdcSkillLevel]);

      expect(enumLabels).toEqual(officialDivisions);
    });
  });

  describe("AccountStatus enum", () => {
    it("should have values within database constraint (0-2)", () => {
      const values = Object.values(AccountStatus).filter((v) => typeof v === "number");
      values.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(2);
      });
    });

    it("should have exactly 3 values", () => {
      const values = Object.values(AccountStatus).filter((v) => typeof v === "number");
      expect(values).toHaveLength(3);
    });

    it("should have sequential values starting from 0", () => {
      expect(AccountStatus.ACTIVE).toBe(0);
      expect(AccountStatus.SUSPENDED).toBe(1);
      expect(AccountStatus.DELETED).toBe(2);
    });

    it("should have labels for all enum values", () => {
      const enumValues = Object.values(AccountStatus).filter(
        (v) => typeof v === "number",
      ) as AccountStatus[];
      enumValues.forEach((value) => {
        expect(ACCOUNT_STATUS_LABELS[value]).toBeDefined();
        expect(ACCOUNT_STATUS_LABELS[value]).not.toBe("");
      });
    });
  });

  describe("Database schema alignment", () => {
    it("should document database constraints", () => {
      // This test serves as living documentation
      const constraints = {
        primary_role: {
          type: "smallint",
          min: 0,
          max: 1,
          nullable: false,
        },
        wsdc_level: {
          type: "smallint",
          min: 0,
          max: 5,
          nullable: true, // null = "Unranked"
        },
        account_status: {
          type: "smallint",
          min: 0,
          max: 2,
          nullable: false,
        },
      };

      // Verify TypeScript enums respect these constraints
      expect(PrimaryRole.LEADER).toBeGreaterThanOrEqual(constraints.primary_role.min);
      expect(PrimaryRole.FOLLOWER).toBeLessThanOrEqual(constraints.primary_role.max);

      expect(WsdcSkillLevel.NEWCOMER).toBeGreaterThanOrEqual(constraints.wsdc_level.min);
      expect(WsdcSkillLevel.CHAMPION).toBeLessThanOrEqual(constraints.wsdc_level.max);

      expect(AccountStatus.ACTIVE).toBeGreaterThanOrEqual(constraints.account_status.min);
      expect(AccountStatus.DELETED).toBeLessThanOrEqual(constraints.account_status.max);
    });
  });

  describe("Enum completeness", () => {
    it("should not have gaps in enum sequences", () => {
      // PrimaryRole: 0, 1
      const roleValues = Object.values(PrimaryRole)
        .filter((v) => typeof v === "number")
        .sort() as number[];
      for (let i = 0; i < roleValues.length; i++) {
        expect(roleValues[i]).toBe(i);
      }

      // WsdcSkillLevel: 0, 1, 2, 3, 4, 5
      const skillValues = Object.values(WsdcSkillLevel)
        .filter((v) => typeof v === "number")
        .sort() as number[];
      for (let i = 0; i < skillValues.length; i++) {
        expect(skillValues[i]).toBe(i);
      }

      // AccountStatus: 0, 1, 2
      const statusValues = Object.values(AccountStatus)
        .filter((v) => typeof v === "number")
        .sort() as number[];
      for (let i = 0; i < statusValues.length; i++) {
        expect(statusValues[i]).toBe(i);
      }
    });
  });
});
