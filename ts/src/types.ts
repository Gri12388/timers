import type WebSocket from "ws";
import type { STOP_TIMER_STATUSES, TIMER_STATUS } from "./constants.js";

export type Session = {
  user: string;
  session: string;
};

export type Timer = {
  id: string;
  user: string;
  isActive: boolean;
  start: number;
  end: number;
  description: string;
  progress: number;
  duration: number;
};

export type TimerStatus = typeof TIMER_STATUS.active | typeof TIMER_STATUS.passive | typeof TIMER_STATUS.all;

export type Password = {
  password: string;
};

export type WsClient = {
  ws: WebSocket;
  sessionId: string;
  user: string;
};

export type Data = {
  status?: string;
  message: string;
};

export type Message = {
  type: string;
  data?: Data;
};

export type StopTimerStatuses =
  | typeof STOP_TIMER_STATUSES.isOld
  | typeof STOP_TIMER_STATUSES.notFound
  | typeof STOP_TIMER_STATUSES.stopped
  | typeof STOP_TIMER_STATUSES.internalError;
