import { BusFront, CircleHelp, House } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatMatchDateTime } from "../../domain/dateAndTimeUtils";

interface MatchHostCardProps {
  opponent: string;
  homeAway: "home" | "away" | "unknown";
  date?: string;
  time?: string;
  location?: string;
  titleLinkTo?: string;
  headerAction?: React.ReactNode;
  meta?: React.ReactNode;
  extra?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
}

export function MatchHostCard({
  opponent,
  homeAway,
  date,
  time,
  location,
  titleLinkTo,
  headerAction,
  meta,
  extra,
  action,
  onClick,
  selected = false,
}: MatchHostCardProps) {
  const navigate = useNavigate();
  const frameClassName = `rounded-lg border bg-base-100 p-3 shadow-sm transition ${
    selected ? "border-primary bg-primary/5" : "border-primary/15"
  } ${onClick || titleLinkTo ? "cursor-pointer hover:border-primary/40" : "hover:border-secondary hover:shadow-md"}`;
  const clickablePath = onClick ? undefined : titleLinkTo;
  const titleNode = titleLinkTo ? (
    <Link
      className="block truncate text-base font-bold leading-snug text-petrol-900 underline-offset-4 hover:underline sm:text-lg"
      to={titleLinkTo}
    >
      {opponent}
    </Link>
  ) : (
    <p className="truncate text-base font-bold leading-snug text-petrol-900 sm:text-lg">{opponent}</p>
  );
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <HomeAwayIcon homeAway={homeAway} />
          <div className="min-w-0">
            {titleNode}
            <p className="mt-1 text-sm text-base-content/70">{formatMatchDateTime(date, time)}</p>
            {location ? <p className="text-sm text-base-content/70">{location}</p> : null}
          </div>
        </div>
        {headerAction ? <div className="flex shrink-0 items-center gap-1.5">{headerAction}</div> : null}
      </div>

      {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      {extra ? <div className="mt-1.5">{extra}</div> : null}
      {action ? <div className="mt-3 w-full lg:max-w-72">{action}</div> : null}
    </>
  );

  if (onClick || clickablePath) {
    function handleActivate() {
      if (onClick) {
        onClick();
        return;
      }

      if (clickablePath) {
        navigate(clickablePath);
      }
    }

    return (
      <article
        className={frameClassName}
        onClick={(event) => {
          if (shouldIgnoreCardActivation(event.target)) {
            return;
          }

          handleActivate();
        }}
        onKeyDown={(event) => {
          if (shouldIgnoreCardActivation(event.target)) {
            return;
          }

          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }

          event.preventDefault();
          handleActivate();
        }}
        role="link"
        tabIndex={0}
      >
        {content}
      </article>
    );
  }

  return <article className={frameClassName}>{content}</article>;
}

function shouldIgnoreCardActivation(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest("a, button, input, textarea, select, label, form"));
}

export function HomeAwayIcon({
  homeAway,
  size = "sm",
}: {
  homeAway: "home" | "away" | "unknown";
  size?: "sm" | "lg";
}) {
  const iconClassName = size === "lg" ? "mt-0.5 h-6 w-6 shrink-0" : "mt-1 h-4 w-4 shrink-0";

  if (homeAway === "home") {
    return <House aria-label="Heimspiel" className={`${iconClassName} text-primary`} strokeWidth={2.2} />;
  }

  if (homeAway === "away") {
    return <BusFront aria-label="Auswärts" className={`${iconClassName} text-primary`} strokeWidth={2.2} />;
  }

  return <CircleHelp aria-label="Ort offen" className={`${iconClassName} text-base-content/50`} strokeWidth={2.2} />;
}
