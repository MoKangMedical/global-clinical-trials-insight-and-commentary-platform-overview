import { eq, and, desc, like, or, inArray, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  trials,
  Trial,
  InsertTrial,
  methodologicalFlaws,
  MethodologicalFlaw,
  InsertMethodologicalFlaw,
  generatedComments,
  GeneratedComment,
  InsertGeneratedComment,
  subscriptions,
  Subscription,
  InsertSubscription,
  userNotes,
  UserNote,
  InsertUserNote,
  exportedDocuments,
  ExportedDocument,
  InsertExportedDocument,
  notificationHistory,
  NotificationHistory,
  InsertNotificationHistory
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== Trials ====================

export async function insertTrial(trial: InsertTrial): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(trials).values(trial);
  return result[0].insertId;
}

export async function getTrialById(id: number): Promise<Trial | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(trials).where(eq(trials.id, id)).limit(1);
  return result[0];
}

export async function getRecentTrials(limit: number = 50, year?: number): Promise<Trial[]> {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(trials);

  // Filter by year if specified (e.g., 2026)
  if (year) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31 23:59:59`);
    query = query.where(
      and(
        gte(trials.publicationDate, startDate),
        lte(trials.publicationDate, endDate)
      )
    ) as any;
  }

  return await query.orderBy(desc(trials.publicationDate)).limit(limit);
}

export async function searchTrials(params: {
  keyword?: string;
  journal?: string;
  phase?: string;
  indication?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}): Promise<Trial[]> {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  
  if (params.keyword) {
    conditions.push(
      or(
        like(trials.title, `%${params.keyword}%`),
        like(trials.abstractText, `%${params.keyword}%`),
        like(trials.indication, `%${params.keyword}%`)
      )
    );
  }
  
  if (params.journal) {
    conditions.push(eq(trials.journal, params.journal));
  }
  
  if (params.phase) {
    conditions.push(eq(trials.trialPhase, params.phase as any));
  }
  
  if (params.indication) {
    conditions.push(like(trials.indication, `%${params.indication}%`));
  }
  
  if (params.dateFrom) {
    conditions.push(gte(trials.publicationDate, params.dateFrom));
  }
  
  if (params.dateTo) {
    conditions.push(lte(trials.publicationDate, params.dateTo));
  }
  
  const query = db.select().from(trials);
  
  if (conditions.length > 0) {
    query.where(and(...conditions));
  }
  
  return await query.orderBy(desc(trials.publicationDate)).limit(params.limit || 50);
}

// ==================== Methodological Flaws ====================

export async function insertMethodologicalFlaw(flaw: InsertMethodologicalFlaw): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(methodologicalFlaws).values(flaw);
  return result[0].insertId;
}

export async function getFlawsByTrialId(trialId: number): Promise<MethodologicalFlaw[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(methodologicalFlaws).where(eq(methodologicalFlaws.trialId, trialId));
}

// ==================== Generated Comments ====================

export async function insertGeneratedComment(comment: InsertGeneratedComment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(generatedComments).values(comment);
  return result[0].insertId;
}

export async function getCommentsByUserId(userId: number): Promise<GeneratedComment[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(generatedComments)
    .where(eq(generatedComments.userId, userId))
    .orderBy(desc(generatedComments.createdAt));
}

export async function getCommentByTrialAndUser(trialId: number, userId: number): Promise<GeneratedComment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(generatedComments)
    .where(and(
      eq(generatedComments.trialId, trialId),
      eq(generatedComments.userId, userId)
    ))
    .orderBy(desc(generatedComments.createdAt))
    .limit(1);
  
  return result[0];
}

export async function updateCommentText(commentId: number, editedText: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(generatedComments)
    .set({ editedText, isEdited: 1, updatedAt: new Date() })
    .where(eq(generatedComments.id, commentId));
}

// ==================== Subscriptions ====================

export async function insertSubscription(subscription: InsertSubscription): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(subscriptions).values(subscription);
  return result[0].insertId;
}

export async function getSubscriptionsByUserId(userId: number): Promise<Subscription[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));
}

export async function updateSubscription(subscriptionId: number, updates: Partial<InsertSubscription>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(subscriptions)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId));
}

export async function deleteSubscription(subscriptionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(subscriptions).where(eq(subscriptions.id, subscriptionId));
}

export async function getActiveSubscriptions(): Promise<Subscription[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(subscriptions)
    .where(eq(subscriptions.notificationEnabled, 1));
}

// ==================== User Notes ====================

export async function insertUserNote(note: InsertUserNote): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(userNotes).values(note);
  return result[0].insertId;
}

export async function getNotesByTrialAndUser(trialId: number, userId: number): Promise<UserNote[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(userNotes)
    .where(and(
      eq(userNotes.trialId, trialId),
      eq(userNotes.userId, userId)
    ))
    .orderBy(desc(userNotes.createdAt));
}

export async function updateUserNote(noteId: number, noteText: string, tags?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: any = { noteText, updatedAt: new Date() };
  if (tags !== undefined) {
    updates.tags = tags;
  }
  
  await db.update(userNotes)
    .set(updates)
    .where(eq(userNotes.id, noteId));
}

export async function deleteUserNote(noteId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(userNotes).where(eq(userNotes.id, noteId));
}

// ==================== Exported Documents ====================

export async function insertExportedDocument(doc: InsertExportedDocument): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(exportedDocuments).values(doc);
  return result[0].insertId;
}

export async function getExportedDocumentsByUserId(userId: number): Promise<ExportedDocument[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(exportedDocuments)
    .where(eq(exportedDocuments.userId, userId))
    .orderBy(desc(exportedDocuments.createdAt));
}

// ==================== Notification History ====================

export async function insertNotificationHistory(notification: InsertNotificationHistory): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notificationHistory).values(notification);
  return result[0].insertId;
}

export async function getNotificationHistoryByUserId(userId: number, limit: number = 50): Promise<NotificationHistory[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(notificationHistory)
    .where(eq(notificationHistory.userId, userId))
    .orderBy(desc(notificationHistory.sentAt))
    .limit(limit);
}
