import type { ParticipantStream } from "@/lib/mock-streams";

const STREAM_CLICK_STORAGE_KEY = "ppb_stream_clicks_v1";

export type StreamClickMap = Record<string, number>;

export function readStreamClickMap(): StreamClickMap {
  try {
    const raw = localStorage.getItem(STREAM_CLICK_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.entries(parsed).reduce<StreamClickMap>((acc, [key, value]) => {
      acc[key] = typeof value === "number" && Number.isFinite(value) ? value : 0;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export function writeStreamClickMap(map: StreamClickMap) {
  localStorage.setItem(STREAM_CLICK_STORAGE_KEY, JSON.stringify(map));
}

export function registerStreamClick(nickname: string) {
  const current = readStreamClickMap();
  const next = {
    ...current,
    [nickname]: (current[nickname] ?? 0) + 1
  };

  writeStreamClickMap(next);
  return next;
}

export function rankStreamsByClicks(streams: ParticipantStream[], clickMap: StreamClickMap) {
  return streams
    .map((stream) => ({
      ...stream,
      clicks: clickMap[stream.nickname] ?? 0
    }))
    .sort((a, b) => {
      if (b.clicks !== a.clicks) return b.clicks - a.clicks;
      return a.nickname.localeCompare(b.nickname);
    });
}
