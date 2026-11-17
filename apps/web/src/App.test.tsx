import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "./App.js";
import type { MeetingType } from "@call-calendar/api-client";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = () =>
  ({
    matches: false,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;

let root: Root;
let container: HTMLDivElement;

async function renderApp(pathname = "/", loadMeetingTypes?: () => Promise<MeetingType[]>) {
  window.history.replaceState({}, "", pathname);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(() => root.render(<App loadMeetingTypes={loadMeetingTypes} />));
}

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
});

beforeEach(() => window.history.replaceState({}, "", "/"));

describe("public booking journey", () => {
  it("shows the agreed home page content without technical API status", async () => {
    await renderApp();

    expect(container.querySelector("h1")?.textContent).toBe("Запишитесь на удобный звонок");
    expect(container.textContent).toContain("Выберите формат");
    expect(container.textContent).toContain("Найдите удобное время");
    expect(container.textContent).toContain("Подтвердите запись");
    expect(container.textContent).toContain("Регистрация не требуется");
    expect(container.textContent).not.toContain("Проверка API");
  });

  it.each(["Записаться", "Записаться на звонок"])(
    "takes the %s CTA to the booking page",
    async (label) => {
      await renderApp();
      const link = [...container.querySelectorAll("a")].find((anchor) =>
        anchor.textContent?.includes(label),
      );
      expect(link).toBeDefined();

      await act(() => link?.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 })));

      expect(window.location.pathname).toBe("/book");
      expect(container.querySelector("h1")?.textContent).toBe("Выберите формат встречи");
    },
  );

  it("shows the meeting type catalog", async () => {
    const meetingType = {
      id: "mt_intro",
      name: "Знакомство",
      description: "Короткий вводный звонок",
      durationMinutes: 30,
    };
    await renderApp("/book", async () => [meetingType]);

    expect(container.textContent).toContain("Знакомство");
    expect(container.textContent).toContain("Короткий вводный звонок");
    expect(container.textContent).toContain("30 минут");
  });

  it.each([
    ["empty", async () => [], "Пока нет доступных типов встреч"],
    ["error", async () => Promise.reject(new Error("network")), "Не удалось загрузить типы встреч"],
  ])("shows the %s catalog state", async (_state, load, message) => {
    await renderApp("/book", load);
    expect(container.textContent).toContain(message);
  });

  it("returns from the booking page to the home page", async () => {
    await renderApp("/book");

    expect(container.textContent).toContain("Выберите формат встречи");
    const backLink = container.querySelector(".secondary-button");
    expect(backLink?.textContent).toContain("Вернуться на главную");

    await act(() => backLink?.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 })));

    expect(window.location.pathname).toBe("/");
    expect(container.querySelector("h1")?.textContent).toBe("Запишитесь на удобный звонок");
  });
});
