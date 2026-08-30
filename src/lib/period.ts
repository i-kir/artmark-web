/** 会期の残り日数。今日が最終日なら 0、過ぎていれば負の数を返す */
export function daysUntil(date: string, today = new Date()): number {
  const target = new Date(`${date}T00:00:00`);
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((target.getTime() - base.getTime()) / (24 * 60 * 60 * 1000));
}
