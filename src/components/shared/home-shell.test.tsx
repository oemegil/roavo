import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeShell } from "@/components/shared/home-shell";
import { ROAVO_BRAND } from "@/lib/brand";

describe("HomeShell", () => {
  it("shows Roavo branding and dual tagline", () => {
    render(<HomeShell />);
    expect(screen.getByRole("heading", { name: ROAVO_BRAND.name })).toBeInTheDocument();
    expect(screen.getByText(ROAVO_BRAND.signature)).toBeInTheDocument();
    expect(screen.getByText(ROAVO_BRAND.promise)).toBeInTheDocument();
    expect(screen.getByText(ROAVO_BRAND.identity)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hesap oluştur" })).toBeInTheDocument();
  });
});
