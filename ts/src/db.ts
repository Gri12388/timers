import { COLLECTIONS, conntctionString, DATABASE, STOP_TIMER_STATUSES, TIMER_STATUS } from "./constants.js";
import type { StopTimerStatuses, Timer, TimerStatus } from "./types.js";
import { getArray, getNumberOrUdf, getTimerOrUdf } from "./checkers.js";
import { MongoClient } from "mongodb";
import { nanoid } from "nanoid";

export class DB {
  private static instance = new DB();

  private timers: Timer[];
  private mongo = conntctionString ? new MongoClient(conntctionString) : undefined;

  private constructor() {
    this.timers = [];
  }

  static getInstance() {
    return DB.instance;
  }

  private async setTimers(client: MongoClient) {
    const db = client.db(DATABASE);
    const collection = db.collection(COLLECTIONS.timers);
    const arr = await collection.find().toArray();
    const timers = getArray(arr, getTimerOrUdf);
    this.timers = timers;
  }

  async initTimers() {
    if (this.mongo && this.timers.length === 0) {
      try {
        const client = await this.mongo.connect();
        await this.setTimers(client);
      } catch (error) {
        console.error(error);
      } finally {
        await this.mongo.close();
      }
    }
  }

  getTimers(status: TimerStatus, user: string) {
    switch (status) {
      case TIMER_STATUS.active:
        return this.timers.filter((item) => item.isActive && item.user === user);
      case TIMER_STATUS.passive:
        return this.timers.filter((item) => !item.isActive && item.user === user);
      default:
        return this.timers.filter((item) => item.user === user);
    }
  }

  async addTimer(description: string, user: string) {
    let result: string | undefined;

    if (this.mongo) {
      try {
        const client = await this.mongo.connect();
        const db = client.db(DATABASE);
        const collection = db.collection(COLLECTIONS.timers);

        const timer: Timer = {
          id: nanoid(),
          user,
          description,
          isActive: true,
          start: Date.now(),
          end: 0,
          progress: 0,
          duration: 0,
        };

        await collection.insertOne(timer);
        await this.setTimers(client);

        result = timer.id;
      } catch (error) {
        console.error(error);
      } finally {
        await this.mongo.close();
      }
    }

    return result;
  }

  async stopTimer(id: string, user: string) {
    let result: StopTimerStatuses = STOP_TIMER_STATUSES.notFound;

    if (this.mongo) {
      try {
        const client = await this.mongo.connect();
        const db = client.db(DATABASE);
        const collection = db.collection(COLLECTIONS.timers);

        const found = await collection.findOne({ id, user });

        if (found) {
          const isActive = found?.isActive;

          if (isActive) {
            const start = getNumberOrUdf(found.start);
            if (start) {
              const { _id } = found;
              const now = Date.now();
              const duration = now - start;
              const updated = await collection.findOneAndUpdate(
                { _id },
                { $set: { isActive: false, end: now, duration } }
              );
              if (updated) {
                await this.setTimers(client);
                result = STOP_TIMER_STATUSES.stopped;
              } else result = STOP_TIMER_STATUSES.isOld;
            } else result = STOP_TIMER_STATUSES.internalError;
          } else result = STOP_TIMER_STATUSES.isOld;
        } else result = STOP_TIMER_STATUSES.notFound;
      } catch (error) {
        console.error(error);
      } finally {
        await this.mongo.close();
      }
    }

    return result;
  }
}
