import path from "path";
import "dotenv/config";

export const HOST = process.env.HOST || "localhost";
export const PROTOCOL = process.env.PROTOCOL || "http";
export const PORT = process.env.PORT || 3000;
export const ORIGIN = `${PROTOCOL}://${HOST}:${PORT}`;

const { CONNECTION_STRING, PGPORT, PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

export const config = {
  port: Number.parseInt(PGPORT ?? "5432", 10),
  host: PGHOST,
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  ssl: true,
};

export const conntctionString = CONNECTION_STRING;

export const DATABASE = "skillbox";

export const COLLECTIONS = {
  creds: "creds",
  sessions: "sessions",
  timers: "timers",
} as const;

export const ERRORS = {
  credentialsNotSet: "It is fail to set login or password",
  logoutFail: "IT is fail to log out",
  noCredentials: "There is neither login nor password",
  noSessionId: "There is no session id",
  wrongCredentials: "It is wrong either login or password",
  somethingWentWrong: "SomethingWentWrong",
  timerNotFound: "Timer is not found",
  userNotFound: "User is not found",
  wrongBody: "wrong body",
  wrongContentType: "wrong Content-Type",
};

export const FILE_PATH = path.resolve("files/credentials.txt");

export const ENCODINGS = {
  utf8: "utf-8",
} as const;

export const COOKIES = {
  sessionId: "sessionId",
} as const;

export const QUERIES = {
  authError: "authError",
} as const;

export const TRUE = "true";
export const FALSE = "false";

export const ROUTES = {
  main: "/",
  timers: "/api/timers",
} as const;

export const HEADERS = {
  sessionId: "x-session-id",
} as const;

export const CONTENT_TYPES = {
  applicationJson: "application/json",
} as const;

export const TIMER_STATUS = {
  all: "all",
  active: "active",
  passive: "passive",
} as const;

export const WS_TYPES = {
  addTimer: "addTimer",
  error: "error",
  logout: "logout",
  showTimers: "showTimers",
  stopTimer: "stopTimer",
} as const;

export const STATUSES = {
  success: "success",
  error: "error",
} as const;

export const STOP_TIMER_STATUSES = {
  stopped: 0,
  notFound: 1,
  isOld: 2,
  internalError: 3,
} as const;
