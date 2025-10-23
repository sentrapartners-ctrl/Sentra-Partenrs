import { Button } from "@/components/ui/button";

export type Period = "today" | "7d" | "15d" | "30d" | "60d" | "90d";

interface PeriodFilterProps {
  value: Period;
  onChange: (period: Period) => void;
}

const periods: { value: Period; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "15d", label: "15 dias" },
  { value: "30d", label: "30 dias" },
  { value: "60d", label: "60 dias" },
  { value: "90d", label: "90 dias" },
];

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={value === period.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(period.value)}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}

export function getPeriodDates(period: Period): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "15d":
      start.setDate(start.getDate() - 15);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "60d":
      start.setDate(start.getDate() - 60);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
  }

  return { start, end };
}

