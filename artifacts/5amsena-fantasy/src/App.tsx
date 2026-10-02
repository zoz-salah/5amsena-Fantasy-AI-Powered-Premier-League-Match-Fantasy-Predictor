import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Clock3, Coffee, Compass, CupSoda, Search, ShieldCheck, Sparkles, Trophy, Users, RefreshCw } from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { useGetFantasyBestXi, useGetFantasyFixtures, useGetFantasyOverview, useSearchFantasyPlayers } from '@workspace/api-client-react';
import type { BestXi, FantasyOverview, FixturePrediction, PlayerProjection } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 45_000, refetchOnWindowFocus: false, retry: 1 } },
});

const navItems = [
  { href: '/', label: 'Gameweek', icon: Compass },
  { href: '/matches', label: 'Match reads', icon: BarChart3 },
  { href: '/best-xi', label: 'Best XI', icon: Trophy },
  { href: '/players', label: 'Players', icon: Users },
];

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const overviewQuery = useGetFantasyOverview();
  const liveSeason = (overviewQuery.data as FantasyOverview | undefined)?.dataStatus.season;
  const routeName = navItems.find((item) => item.href === location)?.label ?? 'Gameweek';
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand" data-testid="link-brand">
          <span className="brand-mark">٥</span>
          <span><span className="brand-title">5amsena</span><span className="brand-sub">Fantasy • Premier League</span></span>
        </Link>
        <div className="nav-label">Your matchday desk</div>
        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href} className={`nav-link ${location === href ? 'active' : ''}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <Icon className="nav-icon" strokeWidth={1.8} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="tea-note">
            <CupSoda size={17} color="#d8b76e" strokeWidth={1.7} />
            <strong>Pull up a chair.</strong>
            <p>Numbers for the team talk. No hot takes without a little evidence.</p>
          </div>
          <div className="side-foot">Built for the long game<br />Cairo · London · everywhere</div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="crumb">5amsena <span style={{ color: '#b5a580' }}>/</span> {routeName}</div>
          <div className="top-meta"><span className="live-dot" /><span>PL data desk</span><span className="top-season">{liveSeason ?? 'Current season'}</span></div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

function Heading({ eyebrow, title, description, gameweek }: { eyebrow: string; title: string; description: string; gameweek?: string | number | null }) {
  return (
    <div className="page-heading">
      <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>
      {gameweek !== undefined && <div className="gw-chip" data-testid="text-current-gameweek"><small>ON THE BOARD</small><b>GW {gameweek ?? '—'}</b></div>}
    </div>
  );
}

function LoadingPanel({ rows = 4 }: { rows?: number }) {
  return <div className="panel" aria-label="Loading data" data-testid="status-loading">
    <div className="panel-head"><div><span className="panel-kicker">Checking the board</span><h2 className="panel-title">Fetching the latest read</h2></div><RefreshCw size={15} color="#a68b53" /></div>
    {Array.from({ length: rows }, (_, i) => <div className="skeleton-block" key={i}><div className="skeleton" style={{ height: 36, marginTop: 15, width: `${82 - i * 5}%` }} /></div>)}
  </div>;
}

function ErrorPanel({ retry, title = 'Couldn’t reach the data desk.' }: { retry: () => void; title?: string }) {
  return <div className="panel error-state" role="alert" data-testid="status-api-error">
    <div className="empty-mark"><AlertTriangle size={19} /></div><h3>{title}</h3>
    <p>The numbers haven’t come through. Your view is unchanged; try again in a moment.</p>
    <button className="retry-button" onClick={retry} data-testid="button-retry"><RefreshCw size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />Try again</button>
  </div>;
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="empty-state" data-testid="status-no-results"><div className="empty-mark"><Search size={19} /></div><h3>{title}</h3><p>{message}</p></div>;
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function money(price: number) { return `£${price.toFixed(1)}m`; }
function pct(value: number) { return `${Number(value).toFixed(1)}%`; }
function probabilityPct(value: number) { return `${(value * 100).toFixed(1)}%`; }
function probabilityWidth(value: number) { return `${Math.max(0, Math.min(100, value * 100))}%`; }
function kickoff(value: string | null) {
  if (!value) return { day: 'TBC', time: 'Kick-off' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: 'TBC', time: 'Kick-off' };
  return { day: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) };
}
function positionName(position: string) { return ({ goalkeeper: 'Goalkeeper', defender: 'Defender', midfielder: 'Midfielder', forward: 'Forward' } as Record<string, string>)[position] ?? position; }

function PlayerAvatar({ player }: { player: PlayerProjection }) {
  return player.photoUrl
    ? <img className="player-initial" src={player.photoUrl} alt="" style={{ objectFit: 'cover' }} />
    : <span className="player-initial" aria-hidden="true">{initials(player.webName || player.name)}</span>;
}

function Metric({ label, value, unit, icon: Icon }: { label: string; value: string | number; unit?: string; icon: typeof Activity }) {
  return <div className="metric" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>
    <div className="metric-top"><span>{label}</span><Icon size={15} className="metric-mark" strokeWidth={1.7} /></div>
    <div className="metric-value">{value}<span className="metric-unit">{unit}</span></div>
  </div>;
}

function FixtureSummary({ fixture }: { fixture: FixturePrediction }) {
  const time = kickoff(fixture.kickoffTime);
  return <div className="fixture-row" data-testid={`fixture-row-${fixture.id}`}>
    <div className="fixture-time"><b>{time.day}</b>{time.time}</div>
    <div className="fixture-teams"><span className="team-tag">{fixture.homeShortName}</span><span>{fixture.homeTeam}</span><span className="versus">v</span><span>{fixture.awayTeam}</span><span className="team-tag">{fixture.awayShortName}</span></div>
    <div className="fixture-right"><div className="probability" aria-label={`${probabilityPct(fixture.homeWin)} home win, ${probabilityPct(fixture.draw)} draw, ${probabilityPct(fixture.awayWin)} away win`}><span style={{ width: probabilityWidth(fixture.homeWin) }} /><span style={{ width: probabilityWidth(fixture.draw) }} /><span style={{ width: probabilityWidth(fixture.awayWin) }} /></div><div className="prob-labels"><span>{Math.round(fixture.homeWin * 100)}%</span><span>{Math.round(fixture.draw * 100)}%</span><span>{Math.round(fixture.awayWin * 100)}%</span></div></div>
  </div>;
}

function LeaderRow({ player }: { player: PlayerProjection }) {
  return <div className="leader-row" data-testid={`top-player-${player.id}`}><PlayerAvatar player={player} /><div><div className="player-main">{player.webName}</div><div className="player-sub">{player.teamShortName} · {positionName(player.position)}</div></div><div className="points">{player.expectedPoints.toFixed(1)}<small>EXPECTED</small></div></div>;
}

function Dashboard() {
  const query = useGetFantasyOverview();
  const overview = query.data as FantasyOverview | undefined;
  const fixtureQuery = useGetFantasyFixtures({ event: overview?.gameweek.target ?? undefined });
  if (query.isLoading) return <div className="content"><Heading eyebrow="The matchday ledger" title="Gameweek desk" description="One good read before the deadline." /><LoadingPanel /></div>;
  if (query.isError || !overview) return <div className="content"><Heading eyebrow="The matchday ledger" title="Gameweek desk" description="One good read before the deadline." /><ErrorPanel retry={() => query.refetch()} /></div>;
  const players = overview.topPlayers ?? [];
  return <div className="content">
    <Heading eyebrow={`${overview.dataStatus.season} · ${overview.dataStatus.predictionMethod}`} title="Gameweek desk" description="The useful numbers, before the neighborhood starts arguing." gameweek={overview.gameweek.target ?? overview.gameweek.current} />
    <div className="metrics-row">
      <Metric label="Fixtures in view" value={overview.upcomingFixtures} icon={Clock3} />
      <Metric label="Predicted" value={overview.predictedFixtures} unit="fixtures" icon={BarChart3} />
      <Metric label="Players tracked" value={overview.dataStatus.playerCount.toLocaleString()} icon={Users} />
      <Metric label="Data status" value={overview.dataStatus.mode === 'live' ? 'Live' : overview.dataStatus.mode} icon={Activity} />
    </div>
    <div className="dashboard-grid">
      <section className="panel">
        <div className="panel-head"><div><span className="panel-kicker">The weekend card</span><h2 className="panel-title">Fixtures worth a look</h2></div><Link className="text-link" href="/matches">All match reads →</Link></div>
        {fixtureQuery.isLoading ? <div className="fixture-list"><div className="skeleton-block"><div className="skeleton" style={{ height: 35, marginTop: 16 }} /></div><div className="skeleton-block"><div className="skeleton" style={{ height: 35, marginTop: 16 }} /></div></div> :
          fixtureQuery.isError ? <div style={{ padding: 20 }}><ErrorPanel retry={() => fixtureQuery.refetch()} title="Fixture reads haven’t come through." /></div> :
          fixtureQuery.data?.length ? <div className="fixture-list">{(fixtureQuery.data as FixturePrediction[]).slice(0, 4).map((fixture) => <FixtureSummary fixture={fixture} key={fixture.id} />)}</div> :
          <EmptyState title="Quiet before kick-off" message="No fixtures have landed on the board yet." />}
      </section>
      <section className="panel">
        <div className="panel-head"><div><span className="panel-kicker">The tea leaves</span><h2 className="panel-title">Signals & watch-outs</h2></div><Coffee size={17} color="#9a7940" /></div>
        <div className="insight-stack">
          <div className="insight signal"><div className="insight-label"><ArrowUpRight size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Biggest signal</div><p>{overview.biggestSignal || 'No standout signal has emerged yet.'}</p></div>
          <div className="insight risk"><div className="insight-label"><ArrowDownRight size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Biggest risk</div><p>{overview.biggestRisk || 'No major risk flagged in the current read.'}</p></div>
        </div>
      </section>
    </div>
    <section className="panel section-gap">
      <div className="panel-head"><div><span className="panel-kicker">Model’s short list</span><h2 className="panel-title">Points to keep an eye on</h2></div><Link className="text-link" href="/players">Player projections →</Link></div>
      {players.length ? <div className="leader-list">{players.slice(0, 5).map((player) => <LeaderRow player={player} key={player.id} />)}</div> : <EmptyState title="No projections yet" message="The short list will appear when player projections are available." />}
    </section>
    <div style={{ textAlign: 'right', marginTop: 12, color: '#899188', font: '9px var(--app-font-mono)' }} data-testid="text-data-updated">LAST UPDATE · {overview.dataStatus.updatedAt ? new Date(overview.dataStatus.updatedAt).toLocaleString('en-GB') : 'NOT AVAILABLE'}</div>
  </div>;
}

function MatchCard({ fixture }: { fixture: FixturePrediction }) {
  const time = kickoff(fixture.kickoffTime);
  return <article className="match-card" data-testid={`match-card-${fixture.id}`}>
    <div className="match-head"><span>{time.day} · {time.time}</span><span className="confidence">{fixture.confidence} confidence</span></div>
    <div className="match-scoreline">
      <div className="match-team"><span className="team-tag">{fixture.homeShortName}</span><strong>{fixture.homeTeam}</strong></div>
      <div className="match-xg">{fixture.expectedHomeGoals.toFixed(1)} <span style={{ color: '#a1a18f' }}>—</span> {fixture.expectedAwayGoals.toFixed(1)}<small>EXPECTED GOALS</small></div>
      <div className="match-team"><span className="team-tag">{fixture.awayShortName}</span><strong>{fixture.awayTeam}</strong></div>
    </div>
    <div className="probability"><span style={{ width: probabilityWidth(fixture.homeWin) }} /><span style={{ width: probabilityWidth(fixture.draw) }} /><span style={{ width: probabilityWidth(fixture.awayWin) }} /></div>
    <div className="match-probs">
      <div className="prob-box"><b>{probabilityPct(fixture.homeWin)}</b><small>Home win</small></div><div className="prob-box"><b>{probabilityPct(fixture.draw)}</b><small>Draw</small></div><div className="prob-box"><b>{probabilityPct(fixture.awayWin)}</b><small>Away win</small></div>
    </div>
    <div className="explain-list">{fixture.explanation?.length ? fixture.explanation.map((line, index) => <div className="explain-item" key={`${fixture.id}-${index}`}><span className="explain-dot" />{line}</div>) : <div className="explain-item"><span className="explain-dot" />Baseline probabilities from the current fixture model.</div>}</div>
  </article>;
}

function Matches() {
  const overviewQuery = useGetFantasyOverview();
  const event = (overviewQuery.data as FantasyOverview | undefined)?.gameweek.target ?? undefined;
  const query = useGetFantasyFixtures({ event });
  if (query.isLoading) return <div className="content"><Heading eyebrow="Read the fixture" title="Match reads" description="Probability, expected goals and the why behind both." /><LoadingPanel rows={5} /></div>;
  if (query.isError || !query.data) return <div className="content"><Heading eyebrow="Read the fixture" title="Match reads" description="Probability, expected goals and the why behind both." /><ErrorPanel retry={() => query.refetch()} /></div>;
  const fixtures = query.data as FixturePrediction[];
  return <div className="content">
    <Heading eyebrow="The numbers behind the noise" title="Match reads" description="Probabilities are a baseline, not a promise. Read the explanation before backing the hunch." gameweek={event ?? '—'} />
    <div className="metrics-row">
      <Metric label="On the slate" value={fixtures.length} unit="fixtures" icon={Clock3} />
      <Metric label="High confidence" value={fixtures.filter((f) => f.confidence === 'high').length} icon={ShieldCheck} />
      <Metric label="Model method" value="Baseline" icon={Activity} />
      <Metric label="Read it, don't chase it" value="—" icon={Sparkles} />
    </div>
    {fixtures.length ? <div className="fixture-grid">{fixtures.map((fixture) => <MatchCard key={fixture.id} fixture={fixture} />)}</div> : <section className="panel"><EmptyState title="No fixtures to call yet" message="The fixture list is empty for this gameweek. Check back when the slate is published." /></section>}
  </div>;
}

function Pitch({ team }: { team: BestXi }) {
  const lines = team.formation.split('-').map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0);
  const grouped: PlayerProjection[][] = [];
  let offset = 1;
  if (team.players.length) {
    grouped.push(team.players.slice(0, 1));
    lines.forEach((count) => { grouped.push(team.players.slice(offset, offset + count)); offset += count; });
    if (offset < team.players.length) grouped.push(team.players.slice(offset));
  }
  return <div className="pitch" aria-label={`Optimized lineup in ${team.formation} formation`}>
    {grouped.map((players, line) => <div className="pitch-line" key={`line-${line}`}>
      {players.map((player) => <div className="pitch-player" key={player.id} title={`${player.name} · ${player.expectedPoints.toFixed(1)} expected points`}>
        <div className={`shirt ${player.id === team.captainId ? 'captain' : player.id === team.viceCaptainId ? 'vice' : ''}`}>{initials(player.webName)}</div>
        <b>{player.webName}</b><small>{player.expectedPoints.toFixed(1)} xPts</small>
      </div>)}
    </div>)}
  </div>;
}

function BestXI() {
  const overviewQuery = useGetFantasyOverview();
  const event = (overviewQuery.data as FantasyOverview | undefined)?.gameweek.target ?? undefined;
  const query = useGetFantasyBestXi({ event });
  if (query.isLoading) return <div className="content"><Heading eyebrow="The model’s starting eleven" title="Best XI" description="A formation-valid side, built around expected points." /><LoadingPanel rows={4} /></div>;
  if (query.isError || !query.data) return <div className="content"><Heading eyebrow="The model’s starting eleven" title="Best XI" description="A formation-valid side, built around expected points." /><ErrorPanel retry={() => query.refetch()} /></div>;
  const team = query.data as BestXi;
  const captain = team.players.find((player) => player.id === team.captainId);
  const vice = team.players.find((player) => player.id === team.viceCaptainId);
  return <div className="content">
    <Heading eyebrow={`GW ${team.event ?? event ?? '—'} · optimized selection`} title="Best XI" description="The strongest expected-points side within the shape and club limits." gameweek={team.event ?? event} />
    <div className="xi-banner"><div><small>Total expected points</small><div className="xi-total">{team.totalExpectedPoints.toFixed(1)} <span>pts</span></div></div><div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', justifyContent: 'flex-end' }}><span className="formation-tag">{team.formation}</span><span className="formation-tag">{team.formationValid ? 'Shape valid' : 'Shape check'}</span></div></div>
    <Pitch team={team} />
    <div className="dashboard-grid">
      <div className="xi-table">
        <div className="panel-head"><div><span className="panel-kicker">The starting side</span><h2 className="panel-title">Eleven on the pitch</h2></div><span className="confidence">{team.players.length} players</span></div>
        <div className="table-wrap"><table className="player-table"><thead><tr><th>Player</th><th>Position</th><th>Club</th><th>Price</th><th>xPts</th><th>Role</th></tr></thead><tbody>{team.players.map((player) => <tr key={player.id} data-testid={`xi-player-${player.id}`}><td><div className="player-cell"><PlayerAvatar player={player} /><div><strong>{player.webName}</strong><small>{player.opponent ? `vs ${player.opponent}` : player.teamName}</small></div></div></td><td><span className="pos-pill">{positionName(player.position)}</span></td><td>{player.teamShortName}</td><td>{money(player.price)}</td><td className="xpts">{player.expectedPoints.toFixed(1)}</td><td className="captain-mark">{player.id === team.captainId ? 'CAPTAIN' : player.id === team.viceCaptainId ? 'VICE' : '—'}</td></tr>)}</tbody></table></div>
      </div>
      <div className="panel">
        <div className="panel-head"><div><span className="panel-kicker">Armband call</span><h2 className="panel-title">Captain & vice</h2></div><Trophy size={17} color="#9a7940" /></div>
        <div className="insight-stack">
          {captain && <div className="insight signal"><div className="insight-label">Captain · {captain.teamShortName}</div><p>{captain.webName} leads the side with {captain.expectedPoints.toFixed(1)} expected points.</p></div>}
          {vice && <div className="insight risk"><div className="insight-label">Vice-captain · {vice.teamShortName}</div><p>{vice.webName} is the cover pick at {vice.expectedPoints.toFixed(1)} expected points.</p></div>}
          <p style={{ margin: '4px 2px', color: '#7e897e', fontSize: 10, lineHeight: 1.55 }}>Club limit: {team.maxPerClub} · {team.formationValid ? 'Formation passes validation.' : 'Formation requires review.'}<br />{team.method}</p>
        </div>
      </div>
    </div>
  </div>;
}

function Players() {
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('all');
  const query = useSearchFantasyPlayers({ search: search.trim() || undefined, limit: 50 });
  if (query.isLoading) return <div className="content"><Heading eyebrow="Player watch" title="Player projections" description="Find the names and numbers behind a proper team-talk." /><LoadingPanel rows={6} /></div>;
  if (query.isError || !query.data) return <div className="content"><Heading eyebrow="Player watch" title="Player projections" description="Find the names and numbers behind a proper team-talk." /><ErrorPanel retry={() => query.refetch()} /></div>;
  const allPlayers = query.data as PlayerProjection[];
  const players = allPlayers.filter((player) => position === 'all' || player.position === position);
  return <div className="content">
    <Heading eyebrow="Find your difference-maker" title="Player projections" description="Search the pool. Sort your own shortlist by the numbers that matter." />
    <div className="metrics-row">
      <Metric label="Players returned" value={allPlayers.length} icon={Users} />
      <Metric label="Top projection" value={allPlayers.length ? Math.max(...allPlayers.map((p) => p.expectedPoints)).toFixed(1) : '—'} unit="xPts" icon={ArrowUpRight} />
      <Metric label="Available pool" value={allPlayers.filter((p) => !p.availability || p.availability.toLowerCase() === 'available').length} icon={ShieldCheck} />
      <Metric label="Search limit" value="50" unit="players" icon={Search} />
    </div>
    <div className="toolbar">
      <label className="search-wrap"><Search size={16} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search player or club…" aria-label="Search players" data-testid="input-search-players" /></label>
      <select className="filter-select" value={position} onChange={(event) => setPosition(event.target.value)} aria-label="Filter by position" data-testid="select-position">
        <option value="all">All positions</option><option value="goalkeeper">Goalkeeper</option><option value="defender">Defender</option><option value="midfielder">Midfielder</option><option value="forward">Forward</option>
      </select>
    </div>
    <section className="panel">
      <div className="panel-head"><div><span className="panel-kicker">Projection table</span><h2 className="panel-title">{players.length} players in this view</h2></div><span className="confidence">Expected points</span></div>
      {!players.length ? <EmptyState title={search ? 'No player found by that name' : 'No players in this slice'} message={search ? 'Try a surname, a shorter spelling, or clear the position filter.' : 'There are no player projections available for this position yet.'} /> :
        <div className="table-wrap"><table className="player-table"><thead><tr><th>Player</th><th>Role</th><th>Price</th><th>xPts</th><th>Form</th><th>Selected</th><th>Pts</th><th>Fixture</th><th>Status</th></tr></thead><tbody>{players.map((player) => <tr key={player.id} data-testid={`player-row-${player.id}`}><td><div className="player-cell"><PlayerAvatar player={player} /><div><strong>{player.webName}</strong><small>{player.teamName}</small></div></div></td><td><span className="pos-pill">{positionName(player.position)}</span></td><td>{money(player.price)}</td><td className="xpts">{player.expectedPoints.toFixed(1)}</td><td>{player.form.toFixed(1)}</td><td>{pct(player.selectedByPercent)}</td><td>{player.totalPoints}</td><td>{player.opponent ? <span>{player.opponent}{player.fixtureDifficulty !== null ? ` · FDR ${player.fixtureDifficulty}` : ''}</span> : '—'}</td><td><span className="pos-pill">{player.availability || 'Unknown'}</span></td></tr>)}</tbody></table></div>}
    </section>
    <div style={{ marginTop: 12, color: '#899188', font: '9px var(--app-font-mono)' }}>Player projection is a model estimate, not a points guarantee.</div>
  </div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>
    <Shell><Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/matches" component={Matches} />
      <Route path="/best-xi" component={BestXI} />
      <Route path="/players" component={Players} />
      <Route component={NotFound} />
    </Switch></Shell>
  </ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;