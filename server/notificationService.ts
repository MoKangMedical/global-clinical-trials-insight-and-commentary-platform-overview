import { Trial } from "../drizzle/schema";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";

/**
 * Check if a trial matches subscription criteria
 */
function matchesSubscription(
  trial: Trial,
  subscription: {
    journals: string | null;
    trialPhases: string | null;
    indications: string | null;
    keywords: string | null;
  }
): boolean {
  // Parse subscription criteria
  const journals = subscription.journals ? JSON.parse(subscription.journals) : [];
  const phases = subscription.trialPhases ? JSON.parse(subscription.trialPhases) : [];
  const indications = subscription.indications ? JSON.parse(subscription.indications) : [];
  const keywords = subscription.keywords ? JSON.parse(subscription.keywords) : [];

  // If no criteria set, match all trials
  if (journals.length === 0 && phases.length === 0 && indications.length === 0 && keywords.length === 0) {
    return true;
  }

  // Check journal match
  if (journals.length > 0 && !journals.includes(trial.journal)) {
    return false;
  }

  // Check phase match
  if (phases.length > 0 && !phases.includes(trial.trialPhase)) {
    return false;
  }

  // Check indication match
  if (indications.length > 0) {
    const trialIndication = (trial.indication || "").toLowerCase();
    const hasIndicationMatch = indications.some((ind: string) =>
      trialIndication.includes(ind.toLowerCase())
    );
    if (!hasIndicationMatch) {
      return false;
    }
  }

  // Check keyword match
  if (keywords.length > 0) {
    const searchText = `${trial.title} ${trial.abstractText || ""} ${trial.indication || ""}`.toLowerCase();
    const hasKeywordMatch = keywords.some((keyword: string) =>
      searchText.includes(keyword.toLowerCase())
    );
    if (!hasKeywordMatch) {
      return false;
    }
  }

  return true;
}

/**
 * Send notification for a new trial to matching subscribers
 */
export async function notifySubscribersForTrial(trialId: number): Promise<{
  notified: number;
  failed: number;
}> {
  const trial = await db.getTrialById(trialId);
  if (!trial) {
    throw new Error("Trial not found");
  }

  const activeSubscriptions = await db.getActiveSubscriptions();
  
  let notified = 0;
  let failed = 0;

  for (const subscription of activeSubscriptions) {
    // Check if trial matches subscription criteria
    if (!matchesSubscription(trial, subscription)) {
      continue;
    }

    try {
      // For email notifications
      if (subscription.emailNotification === 1) {
        // In production, you would integrate with an email service like:
        // - SendGrid
        // - AWS SES
        // - Mailgun
        // - Resend
        
        // For now, we'll use the built-in notification system to notify the owner
        // In production, this should send actual emails to users
        const user = await db.getUserByOpenId(subscription.userId.toString());
        
        if (user?.email) {
          // Placeholder for email sending
          console.log(`[Notification] Would send email to ${user.email} for trial ${trial.title}`);
          
          // Record notification in history
          await db.insertNotificationHistory({
            userId: subscription.userId,
            subscriptionId: subscription.id,
            trialId: trial.id,
            notificationType: "email",
            status: "sent"
          });
          
          notified++;
        }
      }
    } catch (error) {
      console.error(`[Notification] Failed to notify user ${subscription.userId}:`, error);
      
      // Record failed notification
      await db.insertNotificationHistory({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        trialId: trial.id,
        notificationType: "email",
        status: "failed"
      });
      
      failed++;
    }
  }

  console.log(`[Notification] Trial ${trialId}: ${notified} notified, ${failed} failed`);
  
  return { notified, failed };
}

/**
 * Process notifications for newly imported trials
 * This should be called after a trial is successfully imported
 */
export async function processTrialNotifications(trialId: number): Promise<void> {
  try {
    await notifySubscribersForTrial(trialId);
  } catch (error) {
    console.error(`[Notification] Error processing notifications for trial ${trialId}:`, error);
  }
}

/**
 * Send summary notification to platform owner about new trials
 */
export async function sendOwnerDailySummary(stats: {
  newTrials: number;
  notificationsSent: number;
}): Promise<boolean> {
  try {
    const content = `今日临床试验平台更新：

- 新增试验：${stats.newTrials} 个
- 发送通知：${stats.notificationsSent} 次

访问平台查看详情。`;

    return await notifyOwner({
      title: "临床试验平台每日摘要",
      content
    });
  } catch (error) {
    console.error("[Notification] Failed to send owner summary:", error);
    return false;
  }
}
