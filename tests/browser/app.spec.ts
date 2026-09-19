import { test, expect } from "@playwright/test";
test("desktop map, filters, drawer, local photo, rain, answers, and refusal", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByText("Small crossings.")).toBeVisible();
  await expect(page.locator(".map")).toHaveAttribute("data-ready", "true");
  await page.waitForFunction(
    () =>
      Number(document.querySelector(".map")?.getAttribute("data-rendered")) > 0,
  );
  await expect(page.locator(".stats b").first()).toHaveText("1,931");
  await page.getByLabel("Barriers only", { exact: true }).check();
  await page.getByLabel("Fish use recorded").check();
  await page.getByLabel("Culverts only", { exact: true }).check();
  await expect(page.locator(".stats b").first()).not.toHaveText("1,931");
  await page.getByLabel("Search stream or Site ID").fill("920121");
  await expect(page.locator(".stats b").first()).toHaveText("1");
  await page.getByRole("button", { name: "Browse records" }).click();
  await page.locator(".record-row").click();
  await expect(page.locator(".drawer h2")).toHaveText("Zackuse Cr");
  await expect(
    page.getByRole("link", { name: "Open official record" }),
  ).toHaveAttribute("href", /920121/);
  await page.getByText("Preview the 3-sentence briefing").click();
  await expect(page.locator(".briefing")).toContainText("920121");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await expect(page.locator(".mock-note")).toContainText("1 queued locally");
  await page.getByRole("button", { name: "Close details" }).click();
  await page.getByRole("button", { name: "Demo rain" }).click();
  await expect(page.locator(".flush-banner")).toContainText(
    "First-flush window",
  );
  await page.getByRole("button", { name: "Ask this basin" }).first().click();
  await page.getByRole("button", { name: "Explain Zackuse Creek" }).click();
  await expect(page.locator(".answer .citation").first()).toBeVisible();
  await page
    .getByLabel("Ask this basin", { exact: true })
    .fill("Martian weather");
  await page
    .getByRole("button", { name: "Ask the basin", exact: true })
    .click();
  await expect(page.locator(".answer")).toContainText("don't know");
  await page.getByRole("button", { name: "Explore the basin" }).click();
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByLabel("Coho potential / access").check();
  await page.getByLabel("303(d) impaired waters").check();
  await page.screenshot({ path: "docs/desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("mobile drawer, no horizontal overflow, sources", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: /01 Zackuse Creek/ }).click();
  await page.locator(".drawer").scrollIntoViewIfNeeded();
  await expect(page.locator(".drawer")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "docs/mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Close details" }).click();
  await page.getByRole("button", { name: "Sources & limitations" }).click();
  await expect(page.getByRole("dialog")).toContainText("28.6");
});
