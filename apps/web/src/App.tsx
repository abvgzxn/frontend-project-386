import { useEffect, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import {
  Alert,
  Button,
  Card,
  Group,
  MantineProvider,
  NumberInput,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import {
  meetingTypesAvailability,
  bookingsCreate,
  bookingsUpcoming,
  meetingTypesCreate,
  meetingTypesList,
  type AvailableStart,
  type Booking,
  type MeetingType,
} from "@call-calendar/api-client";
import "./App.css";

const bookingPath = "/book";

function usePathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return pathname;
}

function AppLink({
  href,
  children,
  className,
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <a className={className} href={href} onClick={handleClick} aria-label={ariaLabel}>
      {children}
    </a>
  );
}

function ArrowIcon({ direction = "up" }: { direction?: "up" | "left" }) {
  return (
    <svg aria-hidden="true" className="icon" fill="none" focusable="false" viewBox="0 0 16 16">
      {direction === "left" ? (
        <>
          <path d="M14 8H2" />
          <path d="m7 3-5 5 5 5" />
        </>
      ) : (
        <>
          <path d="M3 13 13 3" />
          <path d="M5 3h8v8" />
        </>
      )}
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="spark-icon"
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path d="m12 1 1.6 8.4L22 12l-8.4 1.6L12 22l-1.6-8.4L2 12l8.4-2.6L12 1Z" />
    </svg>
  );
}

function Header() {
  return (
    <header className="site-header">
      <AppLink className="brand" href="/" ariaLabel="Календарь звонков, главная">
        <span className="brand-mark" aria-hidden="true">
          <ArrowIcon />
        </span>
        <span>Календарь звонков</span>
      </AppLink>
      <AppLink className="header-link" href={bookingPath}>
        Записаться <ArrowIcon />
      </AppLink>
    </header>
  );
}

function AbstractGraphic() {
  return (
    <div className="abstract-graphic" aria-hidden="true">
      <div className="graphic-orbit graphic-orbit-one" />
      <div className="graphic-orbit graphic-orbit-two" />
      <div className="graphic-card graphic-card-main">
        <span className="graphic-card-label">Ближайшее время</span>
        <strong>Свободное время</strong>
        <span className="graphic-card-line" />
        <span className="graphic-card-line graphic-card-line-short" />
      </div>
      <div className="graphic-card graphic-card-small">
        <span className="graphic-dot" />
        Без регистрации
      </div>
      <span className="graphic-star graphic-star-one">
        <SparkIcon />
      </span>
      <span className="graphic-star graphic-star-two">
        <SparkIcon />
      </span>
    </div>
  );
}

function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Пространство для разговора</p>
          <h1 id="hero-title">Запишитесь на удобный звонок</h1>
          <p className="hero-description">
            Выберите подходящий формат встречи и свободное время. Регистрация не требуется.
          </p>
          <AppLink className="primary-button" href={bookingPath}>
            Записаться на звонок <ArrowIcon />
          </AppLink>
        </div>
        <AbstractGraphic />
      </section>
      <section className="steps-section" aria-labelledby="steps-title">
        <div className="section-heading">
          <p className="eyebrow">Три простых шага</p>
          <h2 id="steps-title">Всё начинается с подходящего времени</h2>
        </div>
        <ol className="steps-list">
          <li>
            <span className="step-number">01</span>
            <h3>Выберите формат</h3>
            <p>Найдите вариант разговора, который подходит вашей задаче.</p>
          </li>
          <li>
            <span className="step-number">02</span>
            <h3>Найдите удобное время</h3>
            <p>Посмотрите доступные варианты и выберите подходящий момент.</p>
          </li>
          <li>
            <span className="step-number">03</span>
            <h3>Подтвердите запись</h3>
            <p>Подтвердите выбранное время и завершите договорённость о звонке.</p>
          </li>
        </ol>
      </section>
    </>
  );
}

type LoadMeetingTypes = () => Promise<MeetingType[]>;

async function loadMeetingTypesFromApi() {
  const response = await meetingTypesList();
  if (response.error || !response.data) throw new Error("Meeting types request failed");
  return response.data.meetingTypes;
}

async function createMeetingTypeFromApi(input: {
  name: string;
  description: string;
  durationMinutes: number;
}) {
  const response = await meetingTypesCreate({ body: input });
  if (response.error || !response.data) throw new Error("Meeting type creation failed");
  return response.data.meetingType;
}

type LoadAvailability = (meetingTypeId: string, date: string) => Promise<AvailableStart[]>;
type CreateBooking = (input: {
  meetingTypeId: string;
  startsAt: string;
  guestName: string;
}) => Promise<Booking>;

async function loadAvailabilityFromApi(meetingTypeId: string, date: string) {
  const response = await meetingTypesAvailability({
    path: { id: meetingTypeId },
    query: { from: date, to: date },
  });
  if (response.error || !response.data) throw new Error("Availability request failed");
  return response.data.slots;
}

async function createBookingFromApi(input: {
  meetingTypeId: string;
  startsAt: string;
  guestName: string;
}) {
  const response = await bookingsCreate({ body: input });
  if (response.error || !response.data) {
    const error = new Error(response.error?.message ?? "Booking failed") as Error & {
      code?: string;
    };
    error.code = response.error?.code;
    throw error;
  }
  return response.data.booking;
}

type UpcomingBooking = Booking & { meetingTypeName: string };
type LoadUpcomingBookings = () => Promise<UpcomingBooking[]>;

async function loadUpcomingBookingsFromApi() {
  const [bookingsResponse, meetingTypesResponse] = await Promise.all([
    bookingsUpcoming(),
    meetingTypesList(),
  ]);
  if (
    bookingsResponse.error ||
    !bookingsResponse.data ||
    meetingTypesResponse.error ||
    !meetingTypesResponse.data
  ) {
    throw new Error("Upcoming bookings request failed");
  }
  const names = new Map(meetingTypesResponse.data.meetingTypes.map((type) => [type.id, type.name]));
  return bookingsResponse.data.bookings.map((booking) => ({
    ...booking,
    meetingTypeName: names.get(booking.meetingTypeId) ?? "Неизвестный тип встречи",
  }));
}

function moscowDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .format(new Date(`${date}T00:00:00.000Z`))
    .replace(" г.", "");
}

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function BookingPage({
  loadMeetingTypes = loadMeetingTypesFromApi,
  loadAvailability = loadAvailabilityFromApi,
  createBooking = createBookingFromApi,
}: {
  loadMeetingTypes?: LoadMeetingTypes;
  loadAvailability?: LoadAvailability;
  createBooking?: CreateBooking;
}) {
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[] | null>(null);
  const [selectedMeetingType, setSelectedMeetingType] = useState<MeetingType | null>(null);
  const [selectedDate, setSelectedDate] = useState(moscowDate);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [availableStarts, setAvailableStarts] = useState<AvailableStart[] | null>(null);
  const [error, setError] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void loadMeetingTypes()
      .then((types) => {
        if (active) setMeetingTypes(types);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [loadMeetingTypes]);

  useEffect(() => {
    if (!selectedMeetingType) return;
    let active = true;
    setAvailableStarts(null);
    setSelectedStart(null);
    void loadAvailability(selectedMeetingType.id, selectedDate)
      .then((nextSlots) => {
        if (active) setAvailableStarts(nextSlots);
      })
      .catch(() => {
        if (active) setAvailableStarts([]);
      });
    return () => {
      active = false;
    };
  }, [loadAvailability, selectedDate, selectedMeetingType]);

  const dates = Array.from({ length: 14 }, (_, index) => addDate(moscowDate(), index));

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMeetingType || !selectedStart || !guestName.trim() || submitting) return;
    setSubmitting(true);
    setBookingError(null);
    try {
      setBooking(
        await createBooking({
          meetingTypeId: selectedMeetingType.id,
          startsAt: selectedStart,
          guestName,
        }),
      );
    } catch (caught) {
      const failure = caught as Error & { code?: string };
      if (failure.code === "SLOT_UNAVAILABLE") {
        setSelectedStart(null);
        setBookingError(failure.message);
        try {
          setAvailableStarts(await loadAvailability(selectedMeetingType.id, selectedDate));
        } catch {
          setAvailableStarts([]);
        }
      } else {
        setBookingError(failure.message || "Не удалось подтвердить запись.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="booking-page" aria-labelledby="booking-title">
      <p className="eyebrow">Страница записи</p>
      <Title id="booking-title" order={1}>
        Выберите формат встречи
      </Title>
      <Text className="booking-intro">Найдите подходящий вариант разговора, чтобы продолжить.</Text>
      {error ? (
        <Alert color="red" title="Не удалось загрузить типы встреч">
          Попробуйте обновить страницу.
        </Alert>
      ) : meetingTypes === null ? (
        <Text role="status">Загрузка типов встреч...</Text>
      ) : meetingTypes.length === 0 ? (
        <Text role="status">Пока нет доступных типов встреч</Text>
      ) : (
        <Stack className="meeting-type-list" gap="md">
          {meetingTypes.map((meetingType) => (
            <Card
              key={meetingType.id}
              className={`meeting-type-card${selectedMeetingType?.id === meetingType.id ? " selected" : ""}`}
              withBorder
              component="button"
              type="button"
              data-meeting-type-id={meetingType.id}
              onClick={() => setSelectedMeetingType(meetingType)}
              aria-pressed={selectedMeetingType?.id === meetingType.id}
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div>
                  <Title order={2}>{meetingType.name}</Title>
                  <Text>{meetingType.description}</Text>
                </div>
                <Text className="duration">{meetingType.durationMinutes} минут</Text>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
      {selectedMeetingType && (
        <section className="availability-panel" aria-labelledby="availability-title">
          <Title id="availability-title" order={2}>
            Выберите день и время
          </Title>
          <div className="date-list" aria-label="Дни доступности">
            {dates.map((date) => (
              <button
                className={date === selectedDate ? "date-button selected" : "date-button"}
                key={date}
                type="button"
                aria-pressed={date === selectedDate}
                onClick={() => setSelectedDate(date)}
              >
                {formatDay(date)}
              </button>
            ))}
          </div>
          {availableStarts === null ? (
            <Text role="status">Загрузка доступного времени...</Text>
          ) : availableStarts.length === 0 ? (
            <Text role="status">На этот день нет доступного времени</Text>
          ) : (
            <div className="slot-list" aria-label="Доступное время">
              {availableStarts.map((availableStart) => (
                <button
                  className={
                    availableStart.startsAt === selectedStart
                      ? "slot-button selected"
                      : "slot-button"
                  }
                  key={availableStart.startsAt}
                  type="button"
                  data-start={availableStart.startsAt}
                  aria-pressed={availableStart.startsAt === selectedStart}
                  onClick={() => setSelectedStart(availableStart.startsAt)}
                >
                  {formatTime(availableStart.startsAt)}
                </button>
              ))}
            </div>
          )}
          <form className="booking-confirmation" onSubmit={submitBooking}>
            {bookingError && <Alert color="red">{bookingError}</Alert>}
            {booking ? (
              <Alert color="green" title="Запись подтверждена">
                До встречи, {booking.guestName}.
              </Alert>
            ) : (
              <>
                <TextInput
                  label="Ваше имя"
                  name="guestName"
                  value={guestName}
                  onChange={(event) => setGuestName(event.currentTarget.value)}
                  required
                />
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={!selectedStart || !guestName.trim()}
                >
                  Подтвердить запись
                </Button>
              </>
            )}
          </form>
        </section>
      )}
      <AppLink className="secondary-button" href="/">
        <ArrowIcon direction="left" />
        Вернуться на главную
      </AppLink>
    </main>
  );
}

type CreateMeetingType = (input: {
  name: string;
  description: string;
  durationMinutes: number;
}) => Promise<MeetingType>;

function OwnerPage({
  createMeetingType = createMeetingTypeFromApi,
}: {
  createMeetingType?: CreateMeetingType;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<number | string>(30);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<MeetingType | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName || !trimmedDescription) {
      return setError(
        [!trimmedName && "Введите название", !trimmedDescription && "Введите описание"]
          .filter(Boolean)
          .join(". "),
      );
    }
    if (typeof duration !== "number" || !Number.isInteger(duration) || duration <= 0) {
      return setError("Укажите положительную целую длительность");
    }

    setError(null);
    setSaving(true);
    try {
      setCreated(
        await createMeetingType({
          name: trimmedName,
          description: trimmedDescription,
          durationMinutes: duration,
        }),
      );
    } catch {
      setError("Не удалось создать тип встречи. Попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="owner-page" aria-labelledby="owner-title">
      <p className="eyebrow">Владелец календаря</p>
      <Title id="owner-title" order={1}>
        Новый тип встречи
      </Title>
      <Text className="booking-intro">Добавьте формат звонка, который будет виден гостям.</Text>
      <Card className="owner-card" withBorder>
        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            {error && <Alert color="red">{error}</Alert>}
            {created && (
              <Alert color="green" title="Тип встречи создан">
                {created.name} добавлен в каталог.
              </Alert>
            )}
            <TextInput
              label="Название"
              name="name"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />
            <Textarea
              label="Описание"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
            />
            <NumberInput
              label="Длительность, минут"
              name="durationMinutes"
              min={1}
              value={duration}
              onChange={setDuration}
            />
            <Button type="submit" loading={saving}>
              Создать тип встречи
            </Button>
          </Stack>
        </form>
      </Card>
    </main>
  );
}

function formatDateTimeDate(timestamp: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp));
}

function OwnerBookingsPage({
  loadUpcomingBookings = loadUpcomingBookingsFromApi,
}: {
  loadUpcomingBookings?: LoadUpcomingBookings;
}) {
  const [bookings, setBookings] = useState<UpcomingBooking[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void loadUpcomingBookings()
      .then((nextBookings) => {
        if (active) setBookings(nextBookings);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [loadUpcomingBookings]);

  return (
    <main className="owner-page" aria-labelledby="owner-bookings-title">
      <p className="eyebrow">Владелец календаря</p>
      <Title id="owner-bookings-title" order={1}>
        Предстоящие записи
      </Title>
      <Text className="booking-intro">Все подтверждённые звонки, которые ещё впереди.</Text>
      {error ? (
        <Alert color="red" title="Не удалось загрузить записи">
          Попробуйте обновить страницу.
        </Alert>
      ) : bookings === null ? (
        <Text role="status">Загрузка предстоящих записей...</Text>
      ) : bookings.length === 0 ? (
        <Text role="status">Предстоящих записей пока нет</Text>
      ) : (
        <Stack className="upcoming-booking-list" gap="md">
          {bookings.map((booking) => (
            <Card className="upcoming-booking-card" key={booking.id} withBorder>
              <Group justify="space-between" align="flex-start" wrap="wrap">
                <div>
                  <Text className="booking-type">{booking.meetingTypeName}</Text>
                  <Title order={2}>{booking.guestName}</Title>
                </div>
                <Text className="booking-date">{formatDateTimeDate(booking.startsAt)}</Text>
              </Group>
              <Text className="booking-time">
                {formatTime(booking.startsAt)}–{formatTime(booking.endsAt)}
              </Text>
            </Card>
          ))}
        </Stack>
      )}
    </main>
  );
}

export function App({
  loadMeetingTypes,
  createMeetingType,
  loadAvailability,
  createBooking,
  loadUpcomingBookings,
}: {
  loadMeetingTypes?: LoadMeetingTypes;
  createMeetingType?: CreateMeetingType;
  loadAvailability?: LoadAvailability;
  createBooking?: CreateBooking;
  loadUpcomingBookings?: LoadUpcomingBookings;
} = {}) {
  const pathname = usePathname();
  return (
    <MantineProvider>
      <div className="app-shell">
        <Header />
        {pathname === "/owner" ? (
          <OwnerPage createMeetingType={createMeetingType} />
        ) : pathname === "/owner/bookings" ? (
          <OwnerBookingsPage loadUpcomingBookings={loadUpcomingBookings} />
        ) : pathname === bookingPath ? (
          <BookingPage
            loadMeetingTypes={loadMeetingTypes}
            loadAvailability={loadAvailability}
            createBooking={createBooking}
          />
        ) : (
          <main>
            <HomePage />
          </main>
        )}
        <footer className="site-footer">
          <span>Календарь звонков</span>
          <span>Разговоры, которые удобно планировать</span>
        </footer>
      </div>
    </MantineProvider>
  );
}
