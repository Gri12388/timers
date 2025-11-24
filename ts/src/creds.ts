import type { Session } from "./types.js";
import { MongoClient } from "mongodb";
import { nanoid } from "nanoid";
import { getArray, getPasswordOrUdf, getSessionOrUdf } from "./checkers.js";
import { conntctionString, DATABASE, COLLECTIONS } from "./constants.js";

export class Creds {
  private static instance: Creds = new Creds();
  private sessions: Session[] = [];
  private mongo = conntctionString ? new MongoClient(conntctionString) : undefined;
  private constructor() {}

  static getInstance() {
    return Creds.instance;
  }

  private async setSessions(client: MongoClient) {
    const db = client.db(DATABASE);
    const collection = db.collection(COLLECTIONS.sessions);
    const arr = await collection.find().toArray();
    const sessions = getArray(arr, getSessionOrUdf);
    this.sessions = sessions;
  }

  private async addSession(user: string, client: MongoClient) {
    const db = client.db(DATABASE);
    const collection = db.collection(COLLECTIONS.sessions);
    const arr = await collection.find({ user }).toArray();
    if (arr.length !== 0) await collection.deleteMany({ user });
    const data: Session = { user, session: nanoid() };
    await collection.insertOne(data);
  }

  async setCredential(login: string, password: string) {
    let result = false;
    if (this.mongo) {
      try {
        await this.mongo.connect();
        const db = this.mongo.db(DATABASE);
        const collection = db.collection(COLLECTIONS.creds);
        const found = await collection.findOne({ login });
        if (!found) {
          const data = { login, password };
          const { acknowledged } = await collection.insertOne(data);
          result = acknowledged;
        }
      } catch {
        result = false;
      } finally {
        await this.mongo.close();
      }
    }

    return result;
  }

  async getPassword(login: string) {
    let result: string | undefined;
    if (this.mongo) {
      try {
        await this.mongo.connect();
        const db = this.mongo.db(DATABASE);
        const collection = db.collection(COLLECTIONS.creds);
        const doc = await collection.findOne({ login });
        result = getPasswordOrUdf(doc)?.password;
      } catch (error) {
        console.error(error);
      } finally {
        await this.mongo.close();
      }
    }

    return result;
  }

  findUserBySession(session: string) {
    const found = this.sessions.find((item) => item.session === session);
    if (found) return found.user;
    else return undefined;
  }

  findSessionByUser(user: string) {
    const found = this.sessions.find((item) => item.user === user);
    if (found) return found.session;
    else return undefined;
  }

  async getSession(user: string) {
    let result: string | undefined;

    if (this.mongo) {
      try {
        const client = await this.mongo.connect();
        await this.addSession(user, client);
        await this.setSessions(client);
        result = this.findSessionByUser(user);
        return result;
      } catch (error) {
        console.error(error);
      } finally {
        await this.mongo.close();
      }
    }

    return undefined;
  }

  async removeSession(session: string) {
    let result = false;

    if (this.mongo) {
      try {
        const client = await this.mongo.connect();
        const db = client.db(DATABASE);
        const collection = db.collection(COLLECTIONS.sessions);
        await collection.deleteOne({ session });
        this.sessions = this.sessions.filter((item) => item.session !== session);
        result = true;
      } catch (error) {
        console.error(error);
      } finally {
        await this.mongo.close();
      }
    }

    return result;
  }
}
