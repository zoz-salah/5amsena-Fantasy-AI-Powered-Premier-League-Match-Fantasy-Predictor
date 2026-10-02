import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetFantasyBestXiQueryParams,
  GetFantasyBestXiResponse,
  GetFantasyFixturesQueryParams,
  GetFantasyFixturesResponse,
  GetFantasyOverviewResponse,
  SearchFantasyPlayersQueryParams,
  SearchFantasyPlayersResponse,
} from "@workspace/api-zod";
import {
  getBestXi,
  getFixtures,
  getOverview,
  InvalidGameweekError,
  searchPlayers,
} from "../lib/fantasy";

const router: IRouter = Router();

function sendUpstreamError(
  req: Request,
  res: Response,
  error: unknown,
): void {
  if (error instanceof InvalidGameweekError) {
    res.status(400).json({ error: error.message });
    return;
  }
  req.log.error({ err: error }, "Fantasy data request failed");
  res
    .status(502)
    .json({ error: "Live FPL data is temporarily unavailable." });
}

router.get("/5amsena/overview", async (req, res): Promise<void> => {
  try {
    res.json(GetFantasyOverviewResponse.parse(await getOverview()));
  } catch (error) {
    sendUpstreamError(req, res, error);
  }
});

router.get("/5amsena/fixtures", async (req, res): Promise<void> => {
  const query = GetFantasyFixturesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  try {
    res.json(
      GetFantasyFixturesResponse.parse(await getFixtures(query.data.event)),
    );
  } catch (error) {
    sendUpstreamError(req, res, error);
  }
});

router.get("/5amsena/players", async (req, res): Promise<void> => {
  const query = SearchFantasyPlayersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  try {
    res.json(
      SearchFantasyPlayersResponse.parse(
        await searchPlayers(query.data.search, query.data.limit ?? 20),
      ),
    );
  } catch (error) {
    sendUpstreamError(req, res, error);
  }
});

router.get("/5amsena/best-xi", async (req, res): Promise<void> => {
  const query = GetFantasyBestXiQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  try {
    res.json(GetFantasyBestXiResponse.parse(await getBestXi(query.data.event)));
  } catch (error) {
    sendUpstreamError(req, res, error);
  }
});

export default router;