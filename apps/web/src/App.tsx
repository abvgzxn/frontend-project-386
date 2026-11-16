import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
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
            <p>Оставьте нужный контекст и завершите договорённость о звонке.</p>
          </li>
        </ol>
      </section>
    </>
  );
}

function BookingPlaceholder() {
  return (
    <main className="placeholder-page" aria-labelledby="placeholder-title">
      <div className="placeholder-icon" aria-hidden="true">
        <ArrowIcon />
      </div>
      <p className="eyebrow">Страница записи</p>
      <h1 id="placeholder-title">Запись на звонок скоро будет доступна</h1>
      <p>
        Мы готовим страницу записи, где можно будет выбрать формат встречи и удобное время.
        Вернитесь немного позже.
      </p>
      <AppLink className="secondary-button" href="/">
        <ArrowIcon direction="left" />
        Вернуться на главную
      </AppLink>
    </main>
  );
}

export function App() {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <Header />
      {pathname === bookingPath ? (
        <BookingPlaceholder />
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
  );
}
