export type GanttScale = "day" | "week";

export const COL_WIDTH_PX = 36;
export const TOTAL_COLUMNS = 30;
export const LEAD_DAYS_BEFORE_TODAY = 2;

export const todayJST = (): Date => {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  jst.setUTCHours(0, 0, 0, 0);
  return new Date(
    jst.getUTCFullYear(),
    jst.getUTCMonth(),
    jst.getUTCDate()
  );
};

export const parseYMD = (ymd: string): Date => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number): Date => {
  const next = new Date(d);
  next.setDate(d.getDate() + n);
  return next;
};

export const diffDays = (from: Date, to: Date): number => {
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

export const startOfWeek = (d: Date): Date => {
  const dow = d.getDay();
  return addDays(d, -dow);
};

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatYMD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export interface DayCell {
  date: Date;
  isWeekend: boolean;
  isToday: boolean;
}

export const buildDayCells = (start: Date, count: number): DayCell[] => {
  const today = todayJST();
  const cells: DayCell[] = [];
  for (let i = 0; i < count; i++) {
    const d = addDays(start, i);
    const dow = d.getDay();
    cells.push({
      date: d,
      isWeekend: dow === 0 || dow === 6,
      isToday: isSameDay(d, today),
    });
  }
  return cells;
};

export interface MonthSegment {
  year: number;
  month: number;
  span: number;
}

export const buildMonthSegments = (cells: DayCell[]): MonthSegment[] => {
  const segments: MonthSegment[] = [];
  for (const c of cells) {
    const last = segments[segments.length - 1];
    if (
      last &&
      last.year === c.date.getFullYear() &&
      last.month === c.date.getMonth()
    ) {
      last.span += 1;
    } else {
      segments.push({
        year: c.date.getFullYear(),
        month: c.date.getMonth(),
        span: 1,
      });
    }
  }
  return segments;
};
