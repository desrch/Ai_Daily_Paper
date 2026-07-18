import { describe, expect, it } from "vitest";

import {
  normalizeKeywords,
  subscriptionFormSchema,
} from "@/lib/validation/subscription";

describe("subscriptionFormSchema", () => {
  it("requires a topic or custom keyword", () => {
    const result = subscriptionFormSchema.safeParse({
      topics: [],
      customKeywords: "",
      email: "",
      dailyDelivery: false,
    });

    expect(result.success).toBe(false);
  });

  it("requires a valid email only when daily delivery is enabled", () => {
    const enabledResult = subscriptionFormSchema.safeParse({
      topics: ["人工智能"],
      customKeywords: "",
      email: "invalid-email",
      dailyDelivery: true,
    });
    const disabledResult = subscriptionFormSchema.safeParse({
      topics: ["人工智能"],
      customKeywords: "",
      email: "",
      dailyDelivery: false,
    });

    expect(enabledResult.success).toBe(false);
    expect(disabledResult.success).toBe(true);
  });
});

describe("normalizeKeywords", () => {
  it("trims, removes empty values and deduplicates keywords", () => {
    expect(normalizeKeywords(" 大模型，大模型, 芯片、  ")).toEqual([
      "大模型",
      "芯片",
    ]);
  });
});
