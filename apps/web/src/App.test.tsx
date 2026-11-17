import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App.js";
import type { AvailableStart, Booking, MeetingType } from "@call-calendar/api-client";

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

async function renderApp(
  pathname = "/",
  loadMeetingTypes?: () => Promise<MeetingType[]>,
  createMeetingType?: () => Promise<MeetingType>,
  loadAvailability?: (meetingTypeId: string, date: string) => Promise<AvailableStart[]>,
  createBooking?: (input: {
    meetingTypeId: string;
    startsAt: string;
    guestName: string;
  }) => Promise<Booking>,
  loadUpcomingBookings?: () => Promise<(Booking & { meetingTypeName: string })[]>,
) {
  window.history.replaceState({}, "", pathname);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(() =>
    root.render(
      <App
        loadMeetingTypes={loadMeetingTypes}
        createMeetingType={createMeetingType}
        loadAvailability={loadAvailability}
        createBooking={createBooking}
        loadUpcomingBookings={loadUpcomingBookings}
      />,
    ),
  );
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

  it("selects a meeting type, day, and available start through the availability loader", async () => {
    const meetingType = {
      id: "mt_intro",
      name: "Знакомство",
      description: "Короткий вводный звонок",
      durationMinutes: 30,
    };
    const loadAvailability = async (_id: string, date: string) => [
      { startsAt: `${date}T07:00:00.000Z`, endsAt: `${date}T07:30:00.000Z` },
    ];
    await renderApp("/book", async () => [meetingType], undefined, loadAvailability);

    await act(async () => {
      container.querySelector<HTMLButtonElement>(".meeting-type-card")?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain("Выберите день и время");
    expect(container.textContent).toContain("10:00");
    const dayButtons = container.querySelectorAll<HTMLButtonElement>(".date-button");
    await act(async () => dayButtons[1]?.click());
    expect(container.querySelectorAll(".date-button.selected")).toHaveLength(1);
    expect(container.querySelectorAll(".slot-button")).toHaveLength(1);
    await act(() => container.querySelector<HTMLButtonElement>(".slot-button")?.click());
    expect(container.querySelectorAll(".slot-button.selected")).toHaveLength(1);
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

  it("recovers from a conflict without resubmitting the stale start", async () => {
    const meetingType = {
      id: "mt_intro",
      name: "Знакомство",
      description: "Короткий вводный звонок",
      durationMinutes: 30,
    };
    const oldSlot = { startsAt: "2026-06-08T07:00:00.000Z", endsAt: "2026-06-08T07:30:00.000Z" };
    const freshSlot = { startsAt: "2026-06-08T07:30:00.000Z", endsAt: "2026-06-08T08:00:00.000Z" };
    let availabilityCalls = 0;
    let bookingCalls = 0;
    await renderApp(
      "/book",
      async () => [meetingType],
      undefined,
      async () => {
        availabilityCalls += 1;
        return availabilityCalls === 1 ? [oldSlot] : [freshSlot];
      },
      async () => {
        bookingCalls += 1;
        const error = new Error("Выбранное время уже занято") as Error & { code: string };
        error.code = "SLOT_UNAVAILABLE";
        throw error;
      },
    );
    await act(async () => {
      container.querySelector<HTMLButtonElement>(".meeting-type-card")?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await act(() => container.querySelector<HTMLButtonElement>(".slot-button")?.click());
    const name = container.querySelector<HTMLInputElement>('[name="guestName"]')!;
    await act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(name, "Анна");
      name.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      container
        .querySelector(".booking-confirmation")
        ?.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.textContent).toContain("Выбранное время уже занято");
    expect(container.textContent).toContain("10:30");
    expect(container.querySelectorAll(".slot-button.selected")).toHaveLength(0);
    expect(availabilityCalls).toBe(2);
    expect(bookingCalls).toBe(1);
    expect(container.querySelector<HTMLButtonElement>("button[type=submit]")?.disabled).toBe(true);
  });
});

describe("owner meeting type form", () => {
  it("submits a meeting type and shows the success state", async () => {
    await renderApp("/owner", undefined, async () => ({
      id: "mt_intro",
      name: "Знакомство",
      description: "Короткий вводный звонок",
      durationMinutes: 30,
    }));

    const name = container.querySelector<HTMLInputElement>('[name="name"]')!;
    const description = container.querySelector<HTMLTextAreaElement>('[name="description"]')!;
    const duration = container.querySelector<HTMLInputElement>('[name="durationMinutes"]')!;
    await act(async () => {
      const setValue = (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
        const setter = Object.getOwnPropertyDescriptor(element.constructor.prototype, "value")?.set;
        setter?.call(element, value);
        element.dispatchEvent(new Event("input", { bubbles: true }));
      };
      setValue(name, "  Знакомство  ");
      setValue(description, "  Короткий вводный звонок  ");
      setValue(duration, "30");
      container
        .querySelector("form")
        ?.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Тип встречи создан");
    expect(container.textContent).toContain("Знакомство");
  });

  it("shows validation errors without submitting empty fields", async () => {
    await renderApp("/owner", undefined, async () => {
      throw new Error("should not submit");
    });

    await act(() =>
      container
        .querySelector("form")
        ?.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true })),
    );

    expect(container.textContent).toContain("Введите название");
    expect(container.textContent).toContain("Введите описание");
  });
});

describe("owner upcoming bookings", () => {
  it("shows loading, empty, error, and success states", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T08:00:00.000Z"));
    let resolveBookings!: (bookings: (Booking & { meetingTypeName: string })[]) => void;
    const pending = new Promise<(Booking & { meetingTypeName: string })[]>((resolve) => {
      resolveBookings = resolve;
    });
    await renderApp("/owner/bookings", undefined, undefined, undefined, undefined, () => pending);
    expect(container.textContent).toContain("Загрузка предстоящих записей...");
    await act(async () => resolveBookings([]));
    expect(container.textContent).toContain("Предстоящих записей пока нет");

    await act(async () => root.unmount());
    container.remove();
    await renderApp("/owner/bookings", undefined, undefined, undefined, undefined, async () => {
      throw new Error("network");
    });
    expect(container.textContent).toContain("Не удалось загрузить записи");

    await act(async () => root.unmount());
    container.remove();
    await renderApp("/owner/bookings", undefined, undefined, undefined, undefined, async () => [
      {
        id: "booking_1",
        meetingTypeId: "mt_intro",
        meetingTypeName: "Знакомство",
        guestName: "Анна",
        startsAt: "2026-06-08T07:00:00.000Z",
        endsAt: "2026-06-08T07:30:00.000Z",
        createdAt: "2026-06-05T08:00:00.000Z",
      },
    ]);
    expect(container.textContent).toContain("Знакомство");
    expect(container.textContent).toContain("Анна");
    expect(container.textContent).toContain("8 июня 2026 г.");
    expect(container.textContent).toContain("10:00–10:30");
    vi.useRealTimers();
  });
});
