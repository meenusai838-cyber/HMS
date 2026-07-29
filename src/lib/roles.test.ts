import { describe, it, expect } from "vitest";
import { ROLES, ROLE_HOME, ROLE_LABEL, roleHomePath } from "./roles";

describe("roleHomePath", () => {
  it("maps every role to its own home path", () => {
    for (const role of ROLES) {
      expect(roleHomePath(role)).toBe(ROLE_HOME[role]);
    }
  });

  it("returns distinct paths per role", () => {
    const paths = ROLES.map((role) => roleHomePath(role));
    expect(new Set(paths).size).toBe(ROLES.length);
  });
});

describe("ROLE_LABEL", () => {
  it("has a human-readable label for every role", () => {
    for (const role of ROLES) {
      expect(ROLE_LABEL[role]).toBeTruthy();
    }
  });
});
