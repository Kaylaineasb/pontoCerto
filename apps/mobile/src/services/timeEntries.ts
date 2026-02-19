import { api } from "./api";


export type TimeEntryType = "IN" | "BREAK_START" | "BREAK_END" | "OUT";

export type TimeEntryListItem = {
  id: string;
  type: TimeEntryType;
  timestamp: string;
  sequence: number;
  localDate?: string; // se existir
};

type ListResponse = {
  from: string;
  to: string;
  items: TimeEntryListItem[];
};

export async function listTimeEntries(from: string, to: string) {
  const res = await api.get<ListResponse>("/time-entries", {
    params: { from, to },
  });
  return res.data.items;
}

export async function getTimeEntriesByDate(date: string) {
  const res = await api.get<ListResponse>(`/time-entries/${date}`);
  return res.data.items;
}
