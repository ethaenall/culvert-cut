import { test, expect } from "@playwright/test";
test("evidence lab exposes actual complete results, raw outputs, and map navigation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Can the evidence/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Measured evaluation results")).toBeVisible();
  await page
    .getByRole("button", { name: "Reveal both model responses" })
    .click();
  await expect(page.locator(".model-output")).toHaveCount(2);
  await page
    .locator(".model-output")
    .first()
    .getByText("Inspect unedited model output")
    .click();
  await expect(page.locator(".model-output pre").first()).toBeVisible();
  await page.getByRole("button", { name: /Inspect the experiment/ }).click();
  await expect(page.getByRole("dialog")).toContainText("120");
  await page.getByRole("button", { name: "Close experiment" }).click();
  await page.getByLabel("Case group").selectOption("errors");
  await expect(page.locator(".case-pagination")).toBeVisible();
  await page.getByLabel("Case group").selectOption("all");
  await page.getByRole("button", { name: "Next case", exact: true }).click();
  await expect(page.locator(".case-pagination span")).toHaveText("2 / 120");
  await page.getByRole("button", { name: "Locate crossing" }).click();
  await expect(page.locator(".drawer")).toBeVisible();
});
test("evidence lab mobile fits and supports claim reveal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByLabel("Measured evaluation results")).toBeVisible();
  await page
    .getByRole("button", { name: "Not established", exact: true })
    .click();
  await expect(page.locator(".trial-results")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', {name:'Explore the basin', exact:true}).click();
  await page.getByRole('button', {name:'Evidence lab', exact:true}).click();
  await expect(page.getByRole('heading', {name:/Can the evidence/})).toBeVisible();
});

test('live audit result clears when evidence changes and remains separate from recorded trials', async ({ page }) => {
  await page.route('**/api/audit', async route => {
    const request = route.request().postDataJSON();
    await route.fulfill({json:{mode:'adapter',raw:'{"verdict":"insufficient"}',parsed:{verdict:'insufficient',reason:'The record lacks a network assessment.',citations:[request.siteId]},citationCheck:true,seconds:0.3,site:{id:request.siteId,official:'https://wdfw.wa.gov/publications/02061'},note:'Model interpretation; review the source.'}});
  });
  await page.goto('/');
  await page.getByRole('button', {name:'Run a new claim'}).click();
  await page.getByLabel('Claim to audit').fill('All habitat above this crossing is accessible.');
  await page.getByRole('button', {name:'Audit this claim',exact:true}).click();
  await expect(page.locator('.trial-results')).toContainText('The record lacks a network assessment.');
  await page.getByLabel('Claim to audit').fill('The crossing is passable.');
  await expect(page.locator('.trial-results')).toHaveCount(0);
  await page.getByRole('button', {name:'Audit this claim',exact:true}).click();
  await expect(page.locator('.trial-results')).toBeVisible();
  await page.getByRole('button', {name:'Recorded model trials'}).click();
  await expect(page.locator('.trial-results')).toHaveCount(0);
});
