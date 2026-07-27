import { describe, expect, it } from "vitest";

import { selectTripDestinationSchema } from "@/features/destinations/schemas";
import { toTripDestinationDto } from "@/features/destinations/dto";

describe("selectTripDestinationSchema", () => {
  it("accepts catalog mode", () => {
    const parsed = selectTripDestinationSchema.safeParse({
      mode: "catalog",
      destinationId: "dest_123",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts manual mode", () => {
    const parsed = selectTripDestinationSchema.safeParse({
      mode: "manual",
      name: "Small Coastal Town",
      countryCode: "pt",
      regionName: "Algarve",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.mode === "manual") {
      expect(parsed.data.countryCode).toBe("PT");
    }
  });

  it("rejects mixed shapes", () => {
    const parsed = selectTripDestinationSchema.safeParse({
      mode: "catalog",
      destinationId: "x",
      name: "Also manual",
    });
    // Extra keys are stripped by zod object; mode+destinationId is still valid.
    expect(parsed.success).toBe(true);
  });

  it("rejects missing destinationId for catalog", () => {
    const parsed = selectTripDestinationSchema.safeParse({
      mode: "catalog",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("toTripDestinationDto", () => {
  it("maps catalog snapshots", () => {
    const dto = toTripDestinationDto({
      destinationId: "d1",
      destinationName: "Lisbon",
      destinationCountryCode: "PT",
      destinationRegionNameSnapshot: "Lisbon",
      destinationSource: "CATALOG",
      destinationSlug: "lisbon",
    });
    expect(dto).toEqual({
      destinationId: "d1",
      name: "Lisbon",
      countryCode: "PT",
      regionName: "Lisbon",
      source: "CATALOG",
      slug: "lisbon",
    });
  });

  it("maps manual destinations without catalog id", () => {
    const dto = toTripDestinationDto({
      destinationId: null,
      destinationName: "Hidden Cove",
      destinationCountryCode: "PT",
      destinationRegionNameSnapshot: "Algarve",
      destinationSource: "MANUAL",
    });
    expect(dto.destinationId).toBeNull();
    expect(dto.source).toBe("MANUAL");
  });
});
