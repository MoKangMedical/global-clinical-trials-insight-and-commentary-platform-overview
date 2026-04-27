import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "researcher", "editor", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clinical trials data table
 * Stores structured information about clinical trials from top journals
 */
export const trials = mysqlTable("trials", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  authors: text("authors"),
  journal: varchar("journal", { length: 100 }).notNull(),
  doi: varchar("doi", { length: 255 }).unique(),
  pubmedId: varchar("pubmedId", { length: 50 }),
  publicationDate: timestamp("publicationDate").notNull(),
  trialPhase: mysqlEnum("trialPhase", ["I", "II", "III"]).notNull(),
  trialType: varchar("trialType", { length: 100 }),
  indication: text("indication"),
  sampleSize: int("sampleSize"),
  randomization: text("randomization"),
  blinding: text("blinding"),
  primaryEndpoint: text("primaryEndpoint"),
  secondaryEndpoint: text("secondaryEndpoint"),
  keyResults: text("keyResults"),
  statisticalMetrics: text("statisticalMetrics"), // JSON: HR, CI, P-value etc
  conclusion: text("conclusion"),
  abstractText: text("abstractText"),
  fullTextUrl: varchar("fullTextUrl", { length: 500 }),
  sourceUrl: text("sourceUrl"),
  figureUrl: text("figureUrl"), // URL to main figure/image from the paper
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Trial = typeof trials.$inferSelect;
export type InsertTrial = typeof trials.$inferInsert;

/**
 * Methodological flaws identified in trials
 * Stores potential issues in trial design and analysis
 */
export const methodologicalFlaws = mysqlTable("methodological_flaws", {
  id: int("id").autoincrement().primaryKey(),
  trialId: int("trialId").notNull(),
  flawCategory: mysqlEnum("flawCategory", [
    "allocation_concealment",
    "blinding_issues",
    "missing_data",
    "statistical_power",
    "multiple_comparison",
    "endpoint_substitution",
    "other"
  ]).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["high", "medium", "low"]).notNull(),
  description: text("description").notNull(),
  evidence: text("evidence"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MethodologicalFlaw = typeof methodologicalFlaws.$inferSelect;
export type InsertMethodologicalFlaw = typeof methodologicalFlaws.$inferInsert;

/**
 * Generated comments/correspondence for trials
 * Stores AI-generated commentary drafts
 */
export const generatedComments = mysqlTable("generated_comments", {
  id: int("id").autoincrement().primaryKey(),
  trialId: int("trialId").notNull(),
  userId: int("userId").notNull(),
  commentText: text("commentText").notNull(),
  wordCount: int("wordCount"),
  isEdited: int("isEdited").default(0).notNull(), // 0=original, 1=user edited
  editedText: text("editedText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GeneratedComment = typeof generatedComments.$inferSelect;
export type InsertGeneratedComment = typeof generatedComments.$inferInsert;

/**
 * User subscriptions for trial notifications
 * Stores user preferences for automated alerts
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subscriptionName: varchar("subscriptionName", { length: 200 }),
  journals: text("journals"), // JSON array of journal names
  trialPhases: text("trialPhases"), // JSON array: ["I", "II", "III"]
  indications: text("indications"), // JSON array of disease/indication keywords
  keywords: text("keywords"), // JSON array of search keywords
  notificationEnabled: int("notificationEnabled").default(1).notNull(),
  emailNotification: int("emailNotification").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * User notes for trials
 * Stores custom annotations and observations
 */
export const userNotes = mysqlTable("user_notes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  trialId: int("trialId").notNull(),
  noteText: text("noteText").notNull(),
  tags: text("tags"), // JSON array of user-defined tags
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserNote = typeof userNotes.$inferSelect;
export type InsertUserNote = typeof userNotes.$inferInsert;

/**
 * Exported documents tracking
 * Records of user-exported comments and reports
 */
export const exportedDocuments = mysqlTable("exported_documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  trialId: int("trialId"),
  commentId: int("commentId"),
  documentType: mysqlEnum("documentType", ["word", "pdf", "markdown"]).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExportedDocument = typeof exportedDocuments.$inferSelect;
export type InsertExportedDocument = typeof exportedDocuments.$inferInsert;

/**
 * Notification history
 * Tracks sent notifications to users
 */
export const notificationHistory = mysqlTable("notification_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subscriptionId: int("subscriptionId"),
  trialId: int("trialId").notNull(),
  notificationType: mysqlEnum("notificationType", ["email", "app"]).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["sent", "failed"]).default("sent").notNull(),
});

export type NotificationHistory = typeof notificationHistory.$inferSelect;
export type InsertNotificationHistory = typeof notificationHistory.$inferInsert;