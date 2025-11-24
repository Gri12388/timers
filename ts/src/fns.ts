import { createHash } from "crypto";
import { ENCODINGS, FILE_PATH } from "./constants.js";
import { readFile } from "fs/promises";
import type { Message, Timer } from "./types.js";
import type WebSocket from "ws";
import { getMessageOrUdf } from "./checkers.js";

export const hashText = (text: string) => createHash("sha256").update(text).digest("hex");

export const readFromFile = () =>
  readFile(FILE_PATH, { encoding: ENCODINGS.utf8 })
    .then((content) => content)
    .catch(() => JSON.stringify({}));

export const parseContent = (content: string) => {
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
};

export const setProgress = (timers: Timer[]) =>
  timers.map((item) => {
    const now = Date.now();
    const progress = now - item.start;
    return { ...item, end: now, progress };
  });

export const getWsMessage = (data: WebSocket.RawData) => {
  let result: Message | undefined;

  try {
    const text = data.toString(ENCODINGS.utf8);
    const record = JSON.parse(text);
    result = getMessageOrUdf(record);
  } catch {
    return result;
  }

  return result;
};
