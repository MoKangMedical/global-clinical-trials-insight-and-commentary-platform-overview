import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(user?: AuthenticatedUser): TrpcContext {
  const ctx: TrpcContext = {
    user: user || null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return ctx;
}

function createTestUser(role: "user" | "researcher" | "editor" | "admin" = "user"): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

describe("Trials API", () => {
  it("should fetch recent trials without authentication", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trials.getRecent({ limit: 10 });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it("should get trial by ID with flaws", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // First get a trial ID
    const trials = await caller.trials.getRecent({ limit: 1 });
    expect(trials.length).toBeGreaterThan(0);

    const trialId = trials[0]!.id;
    const result = await caller.trials.getById({ id: trialId });

    expect(result).toBeDefined();
    expect(result.trial).toBeDefined();
    expect(result.trial.id).toBe(trialId);
    expect(Array.isArray(result.flaws)).toBe(true);
  });

  it("should search trials with keyword filter", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trials.search({
      keyword: "cancer",
      limit: 20
    });

    expect(Array.isArray(result)).toBe(true);
    // Results may be empty if no trials match, which is acceptable
  });

  it("should search trials with phase filter", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trials.search({
      phase: "III",
      limit: 20
    });

    expect(Array.isArray(result)).toBe(true);
    // All results should be Phase III
    result.forEach(trial => {
      expect(trial.trialPhase).toBe("III");
    });
  });

  it("should require authentication for manual import", async () => {
    const ctx = createTestContext(); // No user
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.trials.importManually({
        title: "Test Trial",
        authors: "Test Author",
        journal: "Test Journal",
        publicationDate: new Date(),
        trialPhase: "III",
        abstractText: "Test abstract"
      })
    ).rejects.toThrow();
  });

  it("should require admin role for manual import", async () => {
    const ctx = createTestContext(createTestUser("user")); // Regular user
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.trials.importManually({
        title: "Test Trial",
        authors: "Test Author",
        journal: "Test Journal",
        publicationDate: new Date(),
        trialPhase: "III",
        abstractText: "Test abstract"
      })
    ).rejects.toThrow("Only admins can import trials manually");
  });
});

describe("Subscriptions API", () => {
  it("should require authentication to get subscriptions", async () => {
    const ctx = createTestContext(); // No user
    const caller = appRouter.createCaller(ctx);

    await expect(caller.subscriptions.getMy()).rejects.toThrow();
  });

  it("should create subscription when authenticated", async () => {
    const ctx = createTestContext(createTestUser());
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscriptions.create({
      subscriptionName: "Test Subscription",
      keywords: ["test", "trial"],
      emailNotification: true
    });

    expect(result).toBeDefined();
    expect(result.subscriptionId).toBeGreaterThan(0);

    // Cleanup: delete the subscription
    await caller.subscriptions.delete({ subscriptionId: result.subscriptionId });
  });

  it("should list user subscriptions", async () => {
    const ctx = createTestContext(createTestUser());
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscriptions.getMy();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Comments API", () => {
  it("should require authentication to generate comment", async () => {
    const ctx = createTestContext(); // No user
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.comments.generate({ trialId: 1 })
    ).rejects.toThrow();
  });

  it("should require authentication to get comments", async () => {
    const ctx = createTestContext(); // No user
    const caller = appRouter.createCaller(ctx);

    await expect(caller.comments.getMyComments()).rejects.toThrow();
  });

  it("should list user comments when authenticated", async () => {
    const ctx = createTestContext(createTestUser());
    const caller = appRouter.createCaller(ctx);

    const result = await caller.comments.getMyComments();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Database Functions", () => {
  it("should retrieve recent trials from database", async () => {
    const trials = await db.getRecentTrials(5);

    expect(Array.isArray(trials)).toBe(true);
    expect(trials.length).toBeGreaterThan(0);
    expect(trials.length).toBeLessThanOrEqual(5);
  });

  it("should search trials by keyword", async () => {
    const trials = await db.searchTrials({
      keyword: "trial",
      limit: 10
    });

    expect(Array.isArray(trials)).toBe(true);
  });

  it("should get trial by ID", async () => {
    const recentTrials = await db.getRecentTrials(1);
    expect(recentTrials.length).toBeGreaterThan(0);

    const trialId = recentTrials[0]!.id;
    const trial = await db.getTrialById(trialId);

    expect(trial).toBeDefined();
    expect(trial?.id).toBe(trialId);
  });
});
