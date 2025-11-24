import express from "express";
import { getStringOrUdf } from "../checkers.js";
import { setProgress } from "../fns.js";
import { CONTENT_TYPES, ERRORS, HEADERS, TIMER_STATUS } from "../constants.js";
import { DB } from "../db.js";
import { Creds } from "../creds.js";
import { locale } from "../locale.js";

export const timersRouter = express.Router();
const creds = Creds.getInstance();
const db = DB.getInstance();

timersRouter.get("/", async (req, res) => {
  const { headers, query } = req;
  const sessionId = getStringOrUdf(headers[HEADERS.sessionId]);

  if (sessionId) {
    const user = creds.findUserBySession(sessionId);

    if (user) {
      if (query.isActive === "true") {
        db.getTimers(TIMER_STATUS.active, user);
        const activeTimers = setProgress(db.getTimers(TIMER_STATUS.active, user));
        res.json(activeTimers);
      } else {
        const passiveTimers = db.getTimers(TIMER_STATUS.passive, user);
        res.json(passiveTimers);
      }
    } else res.status(404).json({ error: ERRORS.userNotFound });
  } else res.status(400).json({ error: ERRORS.noSessionId });
});

timersRouter.post("/", express.json(), async (req, res) => {
  const { body, headers } = req;
  const sessionId = getStringOrUdf(headers[HEADERS.sessionId]);

  if (sessionId) {
    const user = await creds.findUserBySession(sessionId);

    if (user) {
      const contentType = headers["content-type"];
      const description = getStringOrUdf(body.description);

      if (contentType === CONTENT_TYPES.applicationJson) {
        if (description) {
          const id = await db.addTimer(description, user);
          if (id) res.status(201).json({ timerId: id });
          else res.status(500).send(ERRORS.somethingWentWrong);
        } else res.status(400).send(ERRORS.wrongBody);
      } else res.status(400).send(ERRORS.wrongContentType);
    } else res.status(404).json({ error: ERRORS.userNotFound });
  } else res.status(400).json({ error: ERRORS.noSessionId });
});

timersRouter.post("/:id/stop", async (req, res) => {
  const { headers, params } = req;
  const sessionId = getStringOrUdf(headers[HEADERS.sessionId]);

  if (sessionId) {
    const user = await creds.findUserBySession(sessionId);

    if (user) {
      const isStopped = await db.stopTimer(params.id, user);
      if (isStopped) res.status(200).json({ success: locale.timerIsStopped });
      else res.status(400).json({ error: ERRORS.timerNotFound });
    } else res.status(404).json({ error: ERRORS.userNotFound });
  } else res.status(400).json({ error: ERRORS.noSessionId });
});
