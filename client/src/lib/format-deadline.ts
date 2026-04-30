const todayJST = (): string => {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
};

const parseYMD = (ymd: string): Date => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const diffDays = (from: Date, to: Date): number => {
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

export type DeadlineUrgency = "overdue" | "today" | "soon";

export interface DeadlineInfo {
  label: string;
  urgency: DeadlineUrgency;
}

export function formatDeadline(deadline: string): DeadlineInfo {
  const today = parseYMD(todayJST());
  const target = parseYMD(deadline);
  const days = diffDays(today, target);
  const [, m, d] = deadline.split("-");
  const datePart = `${m}/${d}`;

  if (days < 0) {
    return { label: `${datePart} (${-days}日経過)`, urgency: "overdue" };
  }
  if (days === 0) {
    return { label: `${datePart} (今日)`, urgency: "today" };
  }
  return { label: `${datePart} (あと${days}日)`, urgency: "soon" };
}
