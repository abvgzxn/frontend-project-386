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
import { meetingTypesCreate, meetingTypesList, type MeetingType } from "@call-calendar/api-client";
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

function BookingPage({
  loadMeetingTypes = loadMeetingTypesFromApi,
}: {
  loadMeetingTypes?: LoadMeetingTypes;
}) {
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[] | null>(null);
  const [error, setError] = useState(false);

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
            <Card key={meetingType.id} className="meeting-type-card" withBorder>
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

export function App({
  loadMeetingTypes,
  createMeetingType,
}: {
  loadMeetingTypes?: LoadMeetingTypes;
  createMeetingType?: CreateMeetingType;
} = {}) {
  const pathname = usePathname();
  return (
    <MantineProvider>
      <div className="app-shell">
        <Header />
        {pathname === "/owner" ? (
          <OwnerPage createMeetingType={createMeetingType} />
        ) : pathname === bookingPath ? (
          <BookingPage loadMeetingTypes={loadMeetingTypes} />
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
