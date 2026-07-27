import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeShell } from "@/components/shared/home-shell";

describe("HomeShell", () => {
  it("shows Roavo branding and tagline", () => {
    render(<HomeShell />);
    expect(screen.getByRole("heading", { name: "Roavo" })).toBeInTheDocument();
    expect(screen.getByText("Bu seyahati Roavo'layalım.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hesap oluştur" })).toBeInTheDocument();
  });
});
