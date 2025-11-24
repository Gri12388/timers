import express from "express";
import { ERRORS } from "../constants.js";
import { getStringOrUdf } from "../checkers.js";
import { Creds } from "../creds.js";
import { hashText } from "../fns.js";
import { locale } from "../locale.js";

const ENDPOINTS = {
  login: "/login",
  logout: "/logout",
  signup: "/signup",
} as const;

const creds = Creds.getInstance();

export const mainRouter = express.Router();

mainRouter.post(ENDPOINTS.login, express.json(), async (req, res) => {
  const { body } = req;
  const login = getStringOrUdf(body.username);
  const password = getStringOrUdf(body.password);
  if (login && password) {
    const saved = await creds.getPassword(login);
    if (saved) {
      const hash = hashText(password);
      if (hash === saved) {
        const session = await creds.getSession(login);
        if (session !== undefined) {
          res.status(200).json({ message: session });
        } else res.status(500).json({ message: ERRORS.somethingWentWrong });
      } else res.status(401).json({ message: ERRORS.wrongCredentials });
    } else res.status(401).json({ message: ERRORS.wrongCredentials });
  } else res.status(400).json({ message: ERRORS.noCredentials });
});

// mainRouter.get(ENDPOINTS.logout, async (req, res) => {
//   const { headers } = req;
//   const sessionId = getStringOrUdf(headers[HEADERS.sessionId]);
//   if (sessionId) {
//     const isLogout = await creds.removeSession(sessionId);
//     if (isLogout) {
//       res.status(200).json({ success: locale.loggedOut });
//     } else res.status(500).send({ error: ERRORS.logoutFail });
//   } else res.status(400).json({ error: ERRORS.noSessionId });
// });

mainRouter.post(ENDPOINTS.signup, express.json(), async (req, res) => {
  const { body } = req;
  const login = getStringOrUdf(body.username);
  const password = getStringOrUdf(body.password);
  if (login && password) {
    const hash = hashText(password);
    const isSet = await creds.setCredential(login, hash);
    if (isSet) res.status(200).json({ message: locale.credentialsAreSet });
    else res.status(500).json({ message: ERRORS.credentialsNotSet });
  } else res.status(400).json({ message: ERRORS.noCredentials });
});
