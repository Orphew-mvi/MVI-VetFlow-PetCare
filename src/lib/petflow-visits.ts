import { auth } from "@wix/essentials";
import { items } from "@wix/data";

export const VISIT_COLLECTION = "PetFlowVisitSessions";
export const VISIT_COOKIE = "petflow_visit";
export const VISIT_WINDOW_MS = 30 * 60 * 1000;
const timezone = "America/Sao_Paulo";

export function saoPauloDay(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export type VisitRecord = { day: string; country: string; region: string };

export async function recordVisit(visit: VisitRecord): Promise<void> {
  const insert = auth.elevate(items.insert);
  await insert(VISIT_COLLECTION, visit);
}

export async function getVisits(): Promise<VisitRecord[]> {
  const query = auth.elevate(items.query);
  const records: VisitRecord[] = [];
  let offset = 0;
  for (;;) {
    const result = await query(VISIT_COLLECTION, {
      paging: { limit: 1000, offset },
      fields: ["day", "country", "region"]
    }, { consistentRead: true });
    for (const row of result.items ?? []) {
      if (typeof row.day === "string") records.push({
        day: row.day,
        country: typeof row.country === "string" ? row.country : "XX",
        region: typeof row.region === "string" ? row.region : ""
      });
    }
    if (!result.pagingMetadata?.hasNext || !result.items?.length) break;
    offset += result.items.length;
  }
  return records;
}
