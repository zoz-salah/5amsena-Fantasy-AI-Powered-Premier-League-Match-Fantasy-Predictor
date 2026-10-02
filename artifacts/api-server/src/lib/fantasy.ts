import {
  getFplBootstrap,
  getFplFixtures,
  type FplBootstrap,
  type FplEvent,
  type FplFixture,
  type FplPlayer,
  type FplTeam,
} from "./fpl";

export type PlayerPosition =
  | "goalkeeper"
  | "defender"
  | "midfielder"
  | "forward";

export interface PlayerProjection {
  id: number;
  name: string;
  webName: string;
  teamId: number;
  teamName: string;
  teamShortName: string;
  position: PlayerPosition;
  price: number;
  expectedPoints: number;
  form: number;
  selectedByPercent: number;
  totalPoints: number;
  minutes: number;
  goals: number;
  assists: number;
  photoUrl: string | null;
  opponent: string | null;
  fixtureDifficulty: number | null;
  availability: string;
}

export interface FixturePrediction {
  id: number;
  event: number;
  kickoffTime: string | null;
  homeTeamId: number;
  homeTeam: string;
  homeShortName: string;
  awayTeamId: number;
  awayTeam: string;
  awayShortName: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  confidence: "low" | "medium" | "high";
  explanation: string[];
}

export interface BestXi {
  event: number | null;
  formation: string;
  totalExpectedPoints: number;
  captainId: number;
  viceCaptainId: number;
  players: PlayerProjection[];
  maxPerClub: number;
  formationValid: boolean;
  method: string;
}

const POSITION_BY_ELEMENT: Record<number, PlayerPosition> = {
  1: "goalkeeper",
  2: "defender",
  3: "midfielder",
  4: "forward",
};

const METHOD_LABEL =
  "Untrained baseline: official FPL projection blended with form, availability, and fixture difficulty";

export class InvalidGameweekError extends Error {}

function numberValue(value: string | number | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number, places = 1): number {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function teamMap(teams: FplTeam[]): Map<number, FplTeam> {
  return new Map(teams.map((team) => [team.id, team]));
}

function selectTargetEvent(
  events: FplEvent[],
  requestedEvent?: number,
): FplEvent | null {
  if (requestedEvent !== undefined) {
    const event = events.find((item) => item.id === requestedEvent);
    if (!event) {
      throw new InvalidGameweekError("That Gameweek does not exist.");
    }
    return event;
  }

  const upcoming = events.find((event) => event.is_next);
  if (upcoming) return upcoming;

  const now = Date.now();
  const nextUnfinished = events.find(
    (event) => !event.finished && event.deadline_time
      ? new Date(event.deadline_time).getTime() >= now
      : false,
  );
  if (nextUnfinished) return nextUnfinished;

  return events.find((event) => event.is_current) ?? null;
}

async function loadFplData(): Promise<{
  bootstrap: FplBootstrap;
  fixtures: FplFixture[];
}> {
  const [bootstrap, fixtures] = await Promise.all([
    getFplBootstrap(),
    getFplFixtures(),
  ]);
  return { bootstrap, fixtures };
}

function fixtureContext(
  fixtures: FplFixture[],
  teams: Map<number, FplTeam>,
  eventId: number | null,
): Map<number, { opponents: string[]; difficulty: number[] }> {
  const context = new Map<
    number,
    { opponents: string[]; difficulty: number[] }
  >();
  if (eventId === null) return context;

  const addFixture = (
    teamId: number,
    opponentId: number,
    difficulty: number,
  ) => {
    const opponent = teams.get(opponentId);
    if (!opponent) return;
    const existing = context.get(teamId) ?? { opponents: [], difficulty: [] };
    existing.opponents.push(opponent.short_name);
    existing.difficulty.push(difficulty);
    context.set(teamId, existing);
  };

  for (const fixture of fixtures) {
    if (fixture.event !== eventId || fixture.finished) continue;
    addFixture(
      fixture.team_h,
      fixture.team_a,
      fixture.team_h_difficulty,
    );
    addFixture(
      fixture.team_a,
      fixture.team_h,
      fixture.team_a_difficulty,
    );
  }
  return context;
}

function statusForPlayer(player: FplPlayer): {
  label: string;
  availabilityFactor: number;
} {
  const chance = player.chance_of_playing_next_round;
  if (player.status === "i" || player.status === "s" || player.status === "u") {
    return { label: "Unavailable", availabilityFactor: 0 };
  }
  if (player.status === "n" || player.status === "l") {
    return { label: "Not available", availabilityFactor: 0 };
  }
  if (chance !== null && chance < 100) {
    return {
      label: `${chance}% chance`,
      availabilityFactor: clamp(chance / 100, 0, 1),
    };
  }
  if (player.status === "d") {
    return { label: "Doubtful", availabilityFactor: 0.5 };
  }
  return { label: "Available", availabilityFactor: 1 };
}

function projectPlayer(
  player: FplPlayer,
  teams: Map<number, FplTeam>,
  fixtures: Map<number, { opponents: string[]; difficulty: number[] }>,
): PlayerProjection | null {
  const position = POSITION_BY_ELEMENT[player.element_type];
  const team = teams.get(player.team);
  if (!position || !team) return null;

  const form = numberValue(player.form);
  const pointsPerGame = numberValue(player.points_per_game);
  const officialProjection = numberValue(player.ep_next);
  const formProjection = Math.max(0, form * 0.48 + pointsPerGame * 0.52);
  const blendedProjection =
    officialProjection > 0
      ? officialProjection * 0.68 + formProjection * 0.32
      : formProjection;
  const status = statusForPlayer(player);
  const fixtureInfo = fixtures.get(player.team);
  const averageDifficulty = fixtureInfo?.difficulty.length
    ? fixtureInfo.difficulty.reduce((sum, value) => sum + value, 0) /
      fixtureInfo.difficulty.length
    : null;
  const fixtureMultiplier =
    averageDifficulty === null
      ? 1
      : clamp(1 + (3 - averageDifficulty) * 0.075, 0.8, 1.2);
  const expectedPoints = round(
    clamp(blendedProjection * fixtureMultiplier * status.availabilityFactor, 0, 25),
  );

  return {
    id: player.id,
    name: `${player.first_name} ${player.second_name}`.trim(),
    webName: player.web_name,
    teamId: team.id,
    teamName: team.name,
    teamShortName: team.short_name,
    position,
    price: round(player.now_cost / 10, 1),
    expectedPoints,
    form: round(form),
    selectedByPercent: round(numberValue(player.selected_by_percent), 1),
    totalPoints: player.total_points,
    minutes: player.minutes,
    goals: player.goals_scored,
    assists: player.assists,
    photoUrl: player.code
      ? `https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`
      : null,
    opponent: fixtureInfo?.opponents.join(" / ") ?? null,
    fixtureDifficulty:
      averageDifficulty === null ? null : round(averageDifficulty, 1),
    availability: status.label,
  };
}

function getPlayerProjections(
  bootstrap: FplBootstrap,
  fixtures: FplFixture[],
  eventId: number | null,
): PlayerProjection[] {
  const teams = teamMap(bootstrap.teams);
  const playerFixtures = fixtureContext(fixtures, teams, eventId);
  return bootstrap.elements
    .map((player) => projectPlayer(player, teams, playerFixtures))
    .filter((player): player is PlayerProjection => player !== null);
}

function factorial(value: number): number {
  let result = 1;
  for (let index = 2; index <= value; index += 1) result *= index;
  return result;
}

function poisson(mean: number, goals: number): number {
  return (Math.exp(-mean) * mean ** goals) / factorial(goals);
}

interface TeamPerformance {
  attackFactor: number;
  goalsConcededFactor: number;
  form: number;
}

function getTeamPerformance(bootstrap: FplBootstrap): Map<number, TeamPerformance> {
  const raw = bootstrap.teams.map((team) => {
    const players = bootstrap.elements.filter(
      (player) => player.team === team.id && player.minutes > 0,
    );
    const playedMinutes = Math.max(0, ...players.map((player) => player.minutes));
    const matches = Math.max(playedMinutes / 90, 1);
    const expectedInvolvements = players.reduce(
      (sum, player) =>
        sum + numberValue(player.expected_goal_involvements),
      0,
    );
    const totalMinutes = players.reduce(
      (sum, player) => sum + player.minutes,
      0,
    );
    const weightedForm =
      totalMinutes > 0
        ? players.reduce(
            (sum, player) =>
              sum + numberValue(player.form) * player.minutes,
            0,
          ) / totalMinutes
        : 0;
    const goalkeeper = players
      .filter((player) => player.element_type === 1)
      .sort((a, b) => b.minutes - a.minutes)[0];
    const goalkeeperMatches = goalkeeper ? goalkeeper.minutes / 90 : 0;
    const goalsConcededPerMatch =
      goalkeeper && goalkeeperMatches > 0
        ? numberValue(goalkeeper.expected_goals_conceded) / goalkeeperMatches
        : 0;
    return {
      teamId: team.id,
      attackPerMatch: expectedInvolvements / matches,
      goalsConcededPerMatch,
      form: weightedForm,
    };
  });

  const attackingRates = raw
    .map((team) => team.attackPerMatch)
    .filter((rate) => rate > 0);
  const concessionRates = raw
    .map((team) => team.goalsConcededPerMatch)
    .filter((rate) => rate > 0);
  const forms = raw.map((team) => team.form).filter((form) => form > 0);
  const averageAttack =
    attackingRates.reduce((sum, value) => sum + value, 0) /
      Math.max(attackingRates.length, 1) || 1.4;
  const averageConceded =
    concessionRates.reduce((sum, value) => sum + value, 0) /
      Math.max(concessionRates.length, 1) || 1.35;
  const averageForm =
    forms.reduce((sum, value) => sum + value, 0) /
      Math.max(forms.length, 1) || 3;

  return new Map(
    raw.map((team) => [
      team.teamId,
      {
        attackFactor: clamp(
          (team.attackPerMatch > 0
            ? team.attackPerMatch / averageAttack
            : 1) *
            clamp(1 + (team.form - averageForm) * 0.02, 0.9, 1.1),
          0.72,
          1.28,
        ),
        goalsConcededFactor: clamp(
          team.goalsConcededPerMatch > 0
            ? team.goalsConcededPerMatch / averageConceded
            : 1,
          0.72,
          1.3,
        ),
        form: round(team.form),
      },
    ]),
  );
}

function resultProbabilities(
  homeGoals: number,
  awayGoals: number,
): { home: number; draw: number; away: number } {
  let home = 0;
  let draw = 0;
  let away = 0;
  for (let h = 0; h <= 8; h += 1) {
    for (let a = 0; a <= 8; a += 1) {
      const probability = poisson(homeGoals, h) * poisson(awayGoals, a);
      if (h > a) home += probability;
      else if (h === a) draw += probability;
      else away += probability;
    }
  }
  const total = home + draw + away || 1;
  return {
    home: round(home / total, 3),
    draw: round(draw / total, 3),
    away: round(away / total, 3),
  };
}

function createFixturePrediction(
  fixture: FplFixture,
  teams: Map<number, FplTeam>,
  performance: Map<number, TeamPerformance>,
): FixturePrediction | null {
  const home = teams.get(fixture.team_h);
  const away = teams.get(fixture.team_a);
  if (!home || !away || fixture.event === null) return null;

  const homePerformance = performance.get(home.id);
  const awayPerformance = performance.get(away.id);
  if (!homePerformance || !awayPerformance) return null;
  const expectedHomeGoals = round(
    clamp(
      1.38 *
        homePerformance.attackFactor *
        awayPerformance.goalsConcededFactor *
        1.08,
      0.15,
      4.2,
    ),
  );
  const expectedAwayGoals = round(
    clamp(
      1.12 *
        awayPerformance.attackFactor *
        homePerformance.goalsConcededFactor,
      0.15,
      4.2,
    ),
  );
  const probabilities = resultProbabilities(expectedHomeGoals, expectedAwayGoals);
  const ranked = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  const margin = ranked[0][1] - ranked[1][1];
  const confidence: FixturePrediction["confidence"] =
    margin >= 0.24 ? "high" : margin >= 0.12 ? "medium" : "low";

  const favorite =
    ranked[0][0] === "home"
      ? `${home.short_name} win`
      : ranked[0][0] === "away"
        ? `${away.short_name} win`
        : "a draw";

  return {
    id: fixture.id,
    event: fixture.event,
    kickoffTime: fixture.kickoff_time,
    homeTeamId: home.id,
    homeTeam: home.name,
    homeShortName: home.short_name,
    awayTeamId: away.id,
    awayTeam: away.name,
    awayShortName: away.short_name,
    homeWin: probabilities.home,
    draw: probabilities.draw,
    awayWin: probabilities.away,
    expectedHomeGoals,
    expectedAwayGoals,
    confidence,
    explanation: [
      `The baseline leans toward ${favorite} using current FPL player goal involvement and goalkeeper expected goals conceded.`,
      `Home advantage is included; projected score is ${expectedHomeGoals}–${expectedAwayGoals}.`,
      `Recent FPL player form is ${homePerformance.form} for ${home.short_name} and ${awayPerformance.form} for ${away.short_name}; fixture difficulty is ${fixture.team_h_difficulty}/5 and ${fixture.team_a_difficulty}/5.`,
    ],
  };
}

function getSeasonLabel(): string {
  const now = new Date();
  const seasonStart = now.getUTCMonth() >= 6
    ? now.getUTCFullYear()
    : now.getUTCFullYear() - 1;
  return `${seasonStart}/${String(seasonStart + 1).slice(-2)}`;
}

function deadlineLabel(deadline: string | null): string {
  if (!deadline) return "Not announced";
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "Not announced";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(date);
}

export async function getOverview() {
  const { bootstrap, fixtures } = await loadFplData();
  const event = selectTargetEvent(bootstrap.events);
  const currentEvent = bootstrap.events.find((item) => item.is_current);
  const teams = teamMap(bootstrap.teams);
  const performance = getTeamPerformance(bootstrap);
  const targetFixtures = event
    ? fixtures.filter((fixture) => fixture.event === event.id && !fixture.finished)
    : [];
  const predictions = targetFixtures
    .map((fixture) => createFixturePrediction(fixture, teams, performance))
    .filter((fixture): fixture is FixturePrediction => fixture !== null);
  const projections = getPlayerProjections(bootstrap, fixtures, event?.id ?? null)
    .sort((left, right) => right.expectedPoints - left.expectedPoints);

  const topPrediction = predictions
    .map((prediction) => ({
      prediction,
      probability: Math.max(
        prediction.homeWin,
        prediction.draw,
        prediction.awayWin,
      ),
    }))
    .sort((a, b) => b.probability - a.probability)[0]?.prediction;

  return {
    dataStatus: {
      mode: "live" as const,
      season: getSeasonLabel(),
      updatedAt: new Date().toISOString(),
      playerCount: bootstrap.elements.length,
      predictionMethod: METHOD_LABEL,
    },
    gameweek: {
      current: currentEvent?.id ?? null,
      target: event?.id ?? null,
      targetName: event?.name ?? "No upcoming Gameweek",
      deadline: event?.deadline_time ?? null,
      deadlineLabel: deadlineLabel(event?.deadline_time ?? null),
    },
    upcomingFixtures: targetFixtures.length,
    predictedFixtures: predictions.length,
    topPlayers: projections.slice(0, 6),
    biggestSignal: topPrediction
      ? topPrediction.explanation[0]
      : "No upcoming fixtures are published for this Gameweek yet.",
    biggestRisk:
      "This baseline does not include press-conference news, confirmed lineups, or a trained historical model.",
  };
}

export async function getFixtures(requestedEvent?: number) {
  const { bootstrap, fixtures } = await loadFplData();
  const event = selectTargetEvent(bootstrap.events, requestedEvent);
  if (!event) return [];
  const teams = teamMap(bootstrap.teams);
  const performance = getTeamPerformance(bootstrap);
  return fixtures
    .filter((fixture) => fixture.event === event.id && !fixture.finished)
    .map((fixture) => createFixturePrediction(fixture, teams, performance))
    .filter((fixture): fixture is FixturePrediction => fixture !== null)
    .sort((a, b) => {
      if (!a.kickoffTime) return 1;
      if (!b.kickoffTime) return -1;
      return a.kickoffTime.localeCompare(b.kickoffTime);
    });
}

export async function searchPlayers(
  search: string | undefined,
  limit: number,
) {
  const { bootstrap, fixtures } = await loadFplData();
  const event = selectTargetEvent(bootstrap.events);
  const needle = search?.trim().toLocaleLowerCase() ?? "";
  return getPlayerProjections(bootstrap, fixtures, event?.id ?? null)
    .filter((player) =>
      needle.length === 0
        ? true
        : `${player.name} ${player.webName} ${player.teamName} ${player.teamShortName}`
            .toLocaleLowerCase()
            .includes(needle),
    )
    .sort((left, right) => right.expectedPoints - left.expectedPoints)
    .slice(0, limit);
}

function chooseFormation(
  projections: PlayerProjection[],
  eventId: number | null,
): BestXi {
  const formations: Array<[number, number, number]> = [];
  for (let defenders = 3; defenders <= 5; defenders += 1) {
    for (let midfielders = 2; midfielders <= 5; midfielders += 1) {
      const forwards = 10 - defenders - midfielders;
      if (forwards >= 1 && forwards <= 3) {
        formations.push([defenders, midfielders, forwards]);
      }
    }
  }

  const sortedCandidates = {
    goalkeeper: projections.filter(
      (player) => player.position === "goalkeeper" && player.expectedPoints > 0,
    ),
    defender: projections.filter(
      (player) =>
        player.position === "defender" &&
        player.expectedPoints > 0 &&
        player.availability !== "Unavailable",
    ),
    midfielder: projections.filter(
      (player) =>
        player.position === "midfielder" &&
        player.expectedPoints > 0 &&
        player.availability !== "Unavailable",
    ),
    forward: projections.filter(
      (player) =>
        player.position === "forward" &&
        player.expectedPoints > 0 &&
        player.availability !== "Unavailable",
    ),
  };
  for (const list of Object.values(sortedCandidates)) {
    list.sort((left, right) => right.expectedPoints - left.expectedPoints);
  }

  let best:
    | { formation: string; players: PlayerProjection[]; points: number }
    | undefined;

  for (const [defenders, midfielders, forwards] of formations) {
    const candidates = {
      goalkeeper: [...sortedCandidates.goalkeeper],
      defender: [...sortedCandidates.defender],
      midfielder: [...sortedCandidates.midfielder],
      forward: [...sortedCandidates.forward],
    };
    const slots: PlayerPosition[] = [
      "goalkeeper",
      ...Array.from({ length: defenders }, () => "defender" as const),
      ...Array.from({ length: midfielders }, () => "midfielder" as const),
      ...Array.from({ length: forwards }, () => "forward" as const),
    ];
    const selected: PlayerProjection[] = [];
    const teamCounts = new Map<number, number>();

    for (const position of slots) {
      const next = candidates[position].find(
        (player) => (teamCounts.get(player.teamId) ?? 0) < 3,
      );
      if (!next) break;
      selected.push(next);
      teamCounts.set(next.teamId, (teamCounts.get(next.teamId) ?? 0) + 1);
      candidates[position] = candidates[position].filter(
        (player) => player.id !== next.id,
      );
    }

    const uniqueIds = new Set(selected.map((player) => player.id));
    const counts = selected.reduce<Record<string, number>>((result, player) => {
      result[player.position] = (result[player.position] ?? 0) + 1;
      return result;
    }, {});
    const valid =
      selected.length === 11 &&
      uniqueIds.size === 11 &&
      counts.goalkeeper === 1 &&
      (counts.defender ?? 0) >= 3 &&
      (counts.defender ?? 0) <= 5 &&
      (counts.midfielder ?? 0) >= 2 &&
      (counts.midfielder ?? 0) <= 5 &&
      (counts.forward ?? 0) >= 1 &&
      (counts.forward ?? 0) <= 3 &&
      [...teamCounts.values()].every((count) => count <= 3);
    if (!valid) continue;

    const points = selected.reduce(
      (sum, player) => sum + player.expectedPoints,
      0,
    );
    if (!best || points > best.points) {
      best = {
        formation: `${defenders}-${midfielders}-${forwards}`,
        players: selected,
        points,
      };
    }
  }

  if (!best) {
    throw new Error("Not enough available players to build a valid Best XI.");
  }

  const ranked = [...best.players].sort(
    (left, right) => right.expectedPoints - left.expectedPoints,
  );
  return {
    event: eventId,
    formation: best.formation,
    totalExpectedPoints: round(best.points),
    captainId: ranked[0].id,
    viceCaptainId: ranked[1].id,
    players: best.players,
    maxPerClub: 3,
    formationValid: true,
    method:
      "Greedy expected-points selection across legal formations; maximum three players per club.",
  };
}

export async function getBestXi(requestedEvent?: number): Promise<BestXi> {
  const { bootstrap, fixtures } = await loadFplData();
  const event = selectTargetEvent(bootstrap.events, requestedEvent);
  const players = getPlayerProjections(
    bootstrap,
    fixtures,
    event?.id ?? null,
  );
  return chooseFormation(players, event?.id ?? null);
}