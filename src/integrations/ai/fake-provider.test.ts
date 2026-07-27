import { describe, expect, it } from "vitest";

import { FakeAiProvider } from "@/integrations/ai/fake-provider";

describe("FakeAiProvider", () => {
  it("returns destination recommendations by default", async () => {
    const provider = new FakeAiProvider();
    const result = await provider.generateStructured({
      operation: "DESTINATION_RECOMMENDATION",
      systemPrompt: "sys",
      userPrompt: 'CANDIDATES {"id":"abc"} {"id":"def"} {"id":"ghi"}',
      schemaHint: "{}",
    });
    const parsed = JSON.parse(result.text) as {
      recommendations: Array<{ destinationId: string | null }>;
    };
    expect(parsed.recommendations).toHaveLength(3);
    expect(parsed.recommendations[0]?.destinationId).toBe("abc");
  });

  it("can simulate timeout", async () => {
    const provider = new FakeAiProvider();
    provider.setScenario("timeout");
    await expect(
      provider.generateStructured({
        operation: "ITINERARY_GENERATION",
        systemPrompt: "sys",
        userPrompt: "user",
        schemaHint: "{}",
      }),
    ).rejects.toMatchObject({ code: "AI_PROVIDER_TIMEOUT" });
  });
});
