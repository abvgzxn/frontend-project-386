import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "./App.js";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLDivElement;

async function renderApp(pathname = "/") {
  window.history.replaceState({}, "", pathname);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(() => root.render(<App />));
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
      expect(container.querySelector("h1")?.textContent).toBe(
        "Запись на звонок скоро будет доступна",
      );
    },
  );

  it("returns from the honest booking placeholder to the home page", async () => {
    await renderApp("/book");

    expect(container.textContent).toContain("Запись на звонок скоро будет доступна");
    expect(container.textContent).toContain("страницу записи");
    const backLink = container.querySelector(".secondary-button");
    expect(backLink?.textContent).toContain("Вернуться на главную");

    await act(() => backLink?.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 })));

    expect(window.location.pathname).toBe("/");
    expect(container.querySelector("h1")?.textContent).toBe("Запишитесь на удобный звонок");
  });
});
