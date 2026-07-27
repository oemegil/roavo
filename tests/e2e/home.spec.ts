import { expect, test } from "@playwright/test";

test("home page smoke", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();

  await expect(page.getByRole("heading", { name: "Roavo" })).toBeVisible();
  await expect(page.getByText("Let's Roavo this trip.")).toBeVisible();
});

test("protected trips redirects to login", async ({ page }) => {
  await page.goto("/trips");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("register page is reachable", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Join Roavo" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});
