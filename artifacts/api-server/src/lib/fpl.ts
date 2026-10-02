const FPL_API = "https://fantasy.premierleague.com/api";
const CACHE_TTL_MS = 2 * 60 * 1000;

interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

const responseCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<unknown>>();

export interface FplEvent {
  id: number;
  name: string;
  deadline_time: string | null;
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
}

export interface FplTeam {
  id: number;
  name: string;
  short_name: string;
  strength?: number;
  strength_attack_home?: number;
  strength_attack_away?: number;
  strength_defence_home?: number;
  strength_defence_away?: number;
}

export interface FplPlayer {
  id: number;
  code: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
  now_cost: number;
  form: string;
  points_per_game: string;
  selected_by_percent: string;
  total_points: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  photo: string;
  ep_next: string | null;
  chance_of_playing_next_round: number | null;
  status: string;
}

export interface FplFixture {
  id: number;
  event: number | null;
  kickoff_time: string | null;
  finished: boolean;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
}

export interface FplBootstrap {
  events: FplEvent[];
  teams: FplTeam[];
  elements: FplPlayer[];
}

async function fetchFpl<T>(path: string): Promise<T> {
  const cached = responseCache.get(path);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const pending = pendingRequests.get(path);
  if (pending) {
    return pending as Promise<T>;
  }

  const request = (async (): Promise<T> => {
    const response = await fetch(`${FPL_API}/${path}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "5amsena-Fantasy/1.0",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      throw new Error(`FPL returned HTTP ${response.status} for ${path}`);
    }

    const value = (await response.json()) as T;
    responseCache.set(path, {
      value,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return value;
  })();

  pendingRequests.set(path, request);
  try {
    return await request;
  } finally {
    pendingRequests.delete(path);
  }
}

export function getFplBootstrap(): Promise<FplBootstrap> {
  return fetchFpl<FplBootstrap>("bootstrap-static/");
}

export function getFplFixtures(): Promise<FplFixture[]> {
  return fetchFpl<FplFixture[]>("fixtures/");
}