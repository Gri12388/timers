import type { Data, Message, Password, Session, Timer } from "./types.js";

export const getStringOrUdf = (value: any) => (typeof value === "string" ? value : undefined);
export const getNumberOrUdf = (value: any) => (typeof value === "number" ? value : undefined);
export const getBooleanOrUdf = (value: any) => (typeof value === "boolean" ? value : undefined);

export const getObjectOrUdf = (value: any) =>
  typeof value === "object" && value !== null ? (value as Record<string, any>) : undefined;

export const getArray = <T>(value: unknown, checker: (value: unknown) => T | undefined) => {
  const result: T[] = [];

  if (Array.isArray(value)) {
    value.forEach((item) => {
      const checkedItem = checker(item);
      if (checkedItem !== undefined) result.push(checkedItem);
    });
  }

  return result;
};

export const getPasswordOrUdf = (value: unknown) => {
  let result: Password | undefined;

  if (typeof value === "object" && value !== null) {
    const password = "password" in value ? getStringOrUdf(value.password) : undefined;

    if (password !== undefined) result = { password };
  }

  return result;
};

export const getSessionOrUdf = (value: unknown) => {
  let result: Session | undefined;

  if (typeof value === "object" && value !== null) {
    const user = "user" in value ? getStringOrUdf(value.user) : undefined;
    const session = "session" in value ? getStringOrUdf(value.session) : undefined;

    if (user !== undefined && session !== undefined) result = { user, session };
  }

  return result;
};

export const getTimerOrUdf = (value: unknown) => {
  let result: Timer | undefined;

  if (typeof value === "object" && value !== null) {
    const id = "id" in value ? getStringOrUdf(value.id) : undefined;
    const user = "user" in value ? getStringOrUdf(value.user) : undefined;
    const isActive = "isActive" in value ? getBooleanOrUdf(value.isActive) : undefined;
    const start = "start" in value ? getNumberOrUdf(value.start) : undefined;
    const end = "end" in value ? getNumberOrUdf(value.end) : undefined;
    const description = "description" in value ? getStringOrUdf(value.description) : undefined;
    const progress = "progress" in value ? getNumberOrUdf(value.progress) : undefined;
    const duration = "duration" in value ? getNumberOrUdf(value.duration) : undefined;

    if (
      id !== undefined &&
      user !== undefined &&
      isActive !== undefined &&
      start !== undefined &&
      end !== undefined &&
      description !== undefined &&
      progress !== undefined &&
      duration !== undefined
    )
      result = {
        description,
        duration: duration,
        end: end,
        id,
        isActive,
        progress: progress,
        start: start,
        user,
      };
  }

  return result;
};

export const getDataOrUdf = (value: any) => {
  let result: Data | undefined;

  if (typeof value === "object" && value !== null) {
    const status = "status" in value ? getStringOrUdf(value.status) : undefined;
    const message = "message" in value ? getStringOrUdf(value.message) : undefined;

    if (message !== undefined) result = { status, message };
  }

  return result;
};

export const getMessageOrUdf = (value: any) => {
  let result: Message | undefined;

  if (typeof value === "object" && value !== null) {
    const type = "type" in value ? getStringOrUdf(value.type) : undefined;
    const data = "data" in value ? getDataOrUdf(value.data) : undefined;

    if (type !== undefined) result = { type, data };
  }

  return result;
};
