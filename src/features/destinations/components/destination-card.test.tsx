import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { DestinationCard } from "@/features/destinations/components/destination-card";
import type { DestinationSummaryDto } from "@/features/destinations/dto";

const sample: DestinationSummaryDto = {
  id: "d1",
  slug: "lisbon",
  name: "Lisbon",
  type: "CITY",
  countryCode: "PT",
  countryName: "Portugal",
  regionName: "Lisbon",
  shortDescription: "Hilltop viewpoints and Atlantic light.",
  categories: ["FOOD", "HISTORY"],
  bestFor: ["COUPLES"],
  budgetLevel: "MODERATE",
  minimumRecommendedDays: 3,
  maximumRecommendedDays: 5,
  heroImage: null,
  isFeatured: true,
};

describe("DestinationCard", () => {
  it("renders name, location, and detail link", () => {
    render(<DestinationCard destination={sample} />);
    expect(screen.getByRole("heading", { name: "Lisbon" })).toBeInTheDocument();
    expect(screen.getByText(/Portugal/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Destinasyonu gör" })).toHaveAttribute(
      "href",
      "/destinations/lisbon",
    );
  });
});
