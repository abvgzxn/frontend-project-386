import { expect, test } from "@playwright/test";

test("owner and guest complete a booking and recover from a real conflict", async ({
  page,
  request,
}) => {
  const controlledNow = process.env.E2E_CONTROLLED_NOW ?? "2026-06-05T08:00:00.000Z";
  await page.clock.install({ time: new Date(controlledNow) });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const meetingName = `E2E звонок ${suffix}`;
  const guestName = `Гость ${suffix}`;

  await page.goto("/owner");
  await page.getByLabel("Название").fill(meetingName);
  await page.getByLabel("Описание").fill("Проверка полного браузерного сценария");
  await page.getByLabel("Длительность, минут").fill("30");
  await page.getByRole("button", { name: "Создать тип встречи" }).click();
  await expect(page.getByText("Тип встречи создан")).toBeVisible();

  await page.goto("/book");
  const meetingType = page.locator(".meeting-type-card", { hasText: meetingName });
  await meetingType.click();

  const dates = page.locator(".date-button");
  let selectedDate = "";
  for (let index = 0; index < (await dates.count()); index += 1) {
    const dateButton = dates.nth(index);
    await dateButton.click();
    if (await page.locator(".slot-button").count()) {
      selectedDate = await dateButton.getAttribute("class");
      break;
    }
  }
  expect(selectedDate).toContain("selected");

  const firstSlot = page.locator(".slot-button").first();
  const firstStart = await firstSlot.getAttribute("data-start");
  expect(firstStart).toBeTruthy();
  await firstSlot.click();
  await page.getByLabel("Ваше имя").fill(guestName);
  await page.getByRole("button", { name: "Подтвердить запись" }).click();
  await expect(page.getByText("Запись подтверждена")).toBeVisible();

  await page.goto("/owner/bookings");
  await expect(page.getByText(meetingName)).toBeVisible();
  await expect(page.getByRole("heading", { name: guestName })).toBeVisible();

  await page.goto("/book");
  await page.locator(".meeting-type-card", { hasText: meetingName }).click();
  for (let index = 0; index < (await dates.count()); index += 1) {
    const dateButton = dates.nth(index);
    await dateButton.click();
    if (await page.locator(".slot-button").count()) break;
  }
  const conflictSlot = page.locator(".slot-button").first();
  const conflictStart = await conflictSlot.getAttribute("data-start");
  expect(conflictStart).toBeTruthy();
  const availabilityBeforeConflict = await page.locator(".slot-button").count();
  const selectedDateLabel = await page.locator(".date-button.selected").innerText();
  await conflictSlot.click();
  await page.getByLabel("Ваше имя").fill(guestName);

  const meetingTypeId = await meetingType.getAttribute("data-meeting-type-id");
  expect(meetingTypeId).toBeTruthy();
  const occupied = await request.post("/api/bookings", {
    data: { meetingTypeId, startsAt: conflictStart, guestName: `Конфликт ${suffix}` },
  });
  expect(occupied.status()).toBe(201);

  let availabilityRequests = 0;
  let browserBookingRequests = 0;
  page.on("request", (requestEvent) => {
    if (
      requestEvent.url().includes("/api/meeting-types/") &&
      requestEvent.url().includes("availability")
    ) {
      availabilityRequests += 1;
    }
    if (requestEvent.url().endsWith("/api/bookings")) browserBookingRequests += 1;
  });
  await page.getByRole("button", { name: "Подтвердить запись" }).click();

  await expect(page.getByText("Выбранное время уже занято")).toBeVisible();
  await expect(page.getByLabel("Ваше имя")).toHaveValue(guestName);
  await expect(page.locator(".meeting-type-card.selected")).toContainText(meetingName);
  await expect(page.locator(".date-button.selected")).toHaveText(selectedDateLabel);
  await expect(page.locator(".slot-button.selected")).toHaveCount(0);
  await expect(page.locator(".slot-button")).toHaveCount(availabilityBeforeConflict - 1);
  await expect.poll(() => availabilityRequests).toBe(1);

  await page.locator(".booking-confirmation").evaluate((form) => form.requestSubmit());
  await expect.poll(() => browserBookingRequests).toBe(1);
  await expect(page.getByRole("button", { name: "Подтвердить запись" })).toBeDisabled();
});
