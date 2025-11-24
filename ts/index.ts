import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";

import { ORIGIN, PORT, ROUTES, STATUSES, STOP_TIMER_STATUSES, TIMER_STATUS, WS_TYPES } from "./src/constants.js";
import { mainRouter } from "./src/routes/main.js";
import { timersRouter } from "./src/routes/timers.js";
import { Creds } from "./src/creds.js";
import type { WsClient } from "./src/types.js";
import { getWsMessage } from "./src/fns.js";
import { locale } from "./src/locale.js";
import { DB } from "./src/db.js";

let intervalId: NodeJS.Timeout | undefined;
const wsClients: WsClient[] = [];
const INTERVAL = 1000;

const app = express();

app.use(ROUTES.main, mainRouter);
app.use(ROUTES.timers, timersRouter);

const server = createServer(app);
const wsServer = new WebSocketServer({ noServer: true });

server.listen(PORT, () => {
  console.log(`Listening on ${ORIGIN}`);
});

server.on("upgrade", (req, socket, head) => {
  const { host } = req.headers;
  const path = req.url;

  if (host && path) {
    const { searchParams } = new URL(path, `ws://${host}`);
    const token = searchParams.get("token");
    if (token) {
      const creds = Creds.getInstance();
      const user = creds.findUserBySession(token);
      if (user) {
        wsServer.handleUpgrade(req, socket, head, (ws) => {
          const wsClient: WsClient = { ws, sessionId: token, user };
          wsClients.push(wsClient);
          wsServer.emit("connection", ws, req);
        });
      } else socket.destroy();
    } else socket.destroy();
  } else socket.destroy();
});

wsServer.on("connection", async (ws) => {
  const db = DB.getInstance();
  await db.initTimers();
  const user = wsClients.find((item) => item.ws === ws)?.user;

  intervalId = setInterval(() => {
    if (user) {
      const timers = db.getTimers(TIMER_STATUS.all, user);
      timers.forEach((item) => {
        item.progress = Date.now() - item.start;
      });
      const response = {
        type: WS_TYPES.showTimers,
        data: timers,
      };
      ws.send(JSON.stringify(response));
    }
  }, INTERVAL);

  ws.on("message", async (data) => {
    const message = getWsMessage(data);

    if (message) {
      switch (message.type) {
        case WS_TYPES.addTimer: {
          if (message.data) {
            const wsClient = wsClients.find((item) => item.ws === ws);
            if (wsClient) {
              const description = message.data.message;
              const user = wsClient.user;
              const db = DB.getInstance();
              const timerId = await db.addTimer(description, user);
              if (timerId) {
                const response = {
                  type: WS_TYPES.addTimer,
                  data: { status: STATUSES.success, message: timerId },
                };
                ws.send(JSON.stringify(response));
              } else {
                const response = {
                  type: WS_TYPES.addTimer,
                  data: { status: STATUSES.error, message: locale.somethingWentWrong },
                };
                ws.send(JSON.stringify(response));
              }
            } else {
              const response = {
                type: WS_TYPES.addTimer,
                data: { status: STATUSES.error, message: locale.sessionNotFound },
              };
              ws.send(JSON.stringify(response));
            }
          } else {
            const response = {
              type: WS_TYPES.addTimer,
              data: { status: STATUSES.error, message: locale.noDescription },
            };
            ws.send(JSON.stringify(response));
          }
          break;
        }

        case WS_TYPES.logout: {
          const index = wsClients.findIndex((item) => item.ws === ws);
          if (index !== -1) {
            const wsClient = wsClients[index];
            const creds = Creds.getInstance();
            await creds.removeSession(wsClient.sessionId);
            wsClients.splice(index, 1);
            intervalId?.close();
            intervalId = undefined;
            const response = {
              type: WS_TYPES.logout,
              data: { status: STATUSES.success, message: locale.sessionRemoved },
            };
            ws.send(JSON.stringify(response));
          } else {
            const response = {
              type: WS_TYPES.logout,
              data: { status: STATUSES.error, message: locale.sessionNotFound },
            };
            ws.send(JSON.stringify(response));
          }
          break;
        }

        case WS_TYPES.stopTimer: {
          if (message.data) {
            const wsClient = wsClients.find((item) => item.ws === ws);
            if (wsClient) {
              const timerId = message.data.message;
              const user = wsClient.user;
              const db = DB.getInstance();
              const status = await db.stopTimer(timerId, user);
              if (status === STOP_TIMER_STATUSES.stopped) {
                const response = {
                  type: WS_TYPES.stopTimer,
                  data: { status: STATUSES.success, message: locale.timerIsStopped },
                };
                ws.send(JSON.stringify(response));
              } else if (status === STOP_TIMER_STATUSES.isOld) {
                const response = {
                  type: WS_TYPES.stopTimer,
                  data: { status: STATUSES.error, message: locale.timerIsStoppedAlready },
                };
                ws.send(JSON.stringify(response));
              } else if (status === STOP_TIMER_STATUSES.notFound) {
                const response = {
                  type: WS_TYPES.stopTimer,
                  data: { status: STATUSES.error, message: locale.timerNotFound },
                };
                ws.send(JSON.stringify(response));
              } else {
                const response = {
                  type: WS_TYPES.stopTimer,
                  data: { status: STATUSES.error, message: locale.somethingWentWrong },
                };
                ws.send(JSON.stringify(response));
              }
            } else {
              const response = {
                type: WS_TYPES.stopTimer,
                data: { status: STATUSES.error, message: locale.sessionNotFound },
              };
              ws.send(JSON.stringify(response));
            }
          } else {
            const response = {
              type: WS_TYPES.stopTimer,
              data: { status: STATUSES.error, message: locale.noTimerId },
            };
            ws.send(JSON.stringify(response));
          }
          break;
        }
      }
    } else {
      const response = {
        type: WS_TYPES.error,
        data: { status: STATUSES.error, message: locale.messageNotParsed },
      };
      ws.send(JSON.stringify({ response }));
    }
  });
});
