interface BadgeListProps<T extends string> {
  items: T[];
  tone?: "primary" | "secondary" | "neutral";
}

export function BadgeList<T extends string>({ items, tone = "neutral" }: BadgeListProps<T>) {
  const badgeClass = {
    primary: "badge-primary",
    secondary: "badge-secondary text-petrol-900",
    neutral: "badge-outline",
  }[tone];

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span className={`badge ${badgeClass} whitespace-nowrap`} key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}
