import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { generateComment, generateTrialSummary } from "./nlpService";
import { importTrialManually, dailyTrialUpdate } from "./dataCollectionService";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { generateMarkdownDocument, getMimeType, getFileExtension } from "./documentExportService";
import { searchClinicalTrials, fetchArticleDetails, getPDFDownloadLink, getJournalSubmissionUrl } from "./pubmedService";
import { processPDF, getPDFUrl } from "./pdfService";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  trials: router({
    // Get recent trials
    getRecent: publicProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
        year: z.number().optional()
      }))
      .query(async ({ input }) => {
        return await db.getRecentTrials(input.limit, input.year);
      }),

    // Get trial by ID with flaws
    getById: publicProcedure
      .input(z.object({
        id: z.number()
      }))
      .query(async ({ input }) => {
        const trial = await db.getTrialById(input.id);
        if (!trial) {
          throw new Error("Trial not found");
        }
        
        const flaws = await db.getFlawsByTrialId(input.id);
        
        return {
          trial,
          flaws
        };
      }),

    // Search trials with filters
    search: publicProcedure
      .input(z.object({
        keyword: z.string().optional(),
        journal: z.string().optional(),
        phase: z.enum(["I", "II", "III"]).optional(),
        indication: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        limit: z.number().optional().default(50)
      }))
      .query(async ({ input }) => {
        return await db.searchTrials(input);
      }),

    // Import trial manually (admin only)
    importManually: protectedProcedure
      .input(z.object({
        title: z.string(),
        authors: z.string(),
        journal: z.string(),
        doi: z.string().optional(),
        pubmedId: z.string().optional(),
        publicationDate: z.date(),
        trialPhase: z.enum(["I", "II", "III"]),
        abstractText: z.string(),
        fullTextUrl: z.string().optional(),
        sourceUrl: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can import trials manually");
        }
        
        const trialId = await importTrialManually(input);
        return { trialId };
      }),

    // Trigger daily update (admin only)
    triggerDailyUpdate: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can trigger updates");
        }
        
        const result = await dailyTrialUpdate();
        return result;
      }),

    // Generate summary for a trial
    generateSummary: protectedProcedure
      .input(z.object({
        trialId: z.number()
      }))
      .mutation(async ({ input }) => {
        const trial = await db.getTrialById(input.trialId);
        if (!trial) {
          throw new Error("Trial not found");
        }
        
        const summary = await generateTrialSummary(trial);
        return { summary };
      })
  }),

  comments: router({
    // Generate comment for a trial
    generate: protectedProcedure
      .input(z.object({
        trialId: z.number()
      }))
      .mutation(async ({ input, ctx }) => {
        const trial = await db.getTrialById(input.trialId);
        if (!trial) {
          throw new Error("Trial not found");
        }
        
        const flaws = await db.getFlawsByTrialId(input.trialId);
        
        // Transform flaws to match expected format
        const flawsForComment = flaws.map(f => ({
          category: f.flawCategory,
          riskLevel: f.riskLevel,
          description: f.description,
          evidence: f.evidence || ""
        }));
        
        const { commentText, wordCount } = await generateComment(trial, flawsForComment);
        
        // Save generated comment
        const commentId = await db.insertGeneratedComment({
          trialId: input.trialId,
          userId: ctx.user.id,
          commentText,
          wordCount,
          isEdited: 0
        });
        
        return {
          commentId,
          commentText,
          wordCount
        };
      }),

    // Get user's comment history
    getMyComments: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getCommentsByUserId(ctx.user.id);
      }),

    // Get comment for specific trial
    getForTrial: protectedProcedure
      .input(z.object({
        trialId: z.number()
      }))
      .query(async ({ input, ctx }) => {
        return await db.getCommentByTrialAndUser(input.trialId, ctx.user.id);
      }),

    // Update comment text
    update: protectedProcedure
      .input(z.object({
        commentId: z.number(),
        editedText: z.string()
      }))
      .mutation(async ({ input }) => {
        await db.updateCommentText(input.commentId, input.editedText);
        return { success: true };
      }),

    // Export comment as document
    export: protectedProcedure
      .input(z.object({
        commentId: z.number(),
        format: z.enum(["markdown", "pdf", "word"])
      }))
      .mutation(async ({ input, ctx }) => {
        const comments = await db.getCommentsByUserId(ctx.user.id);
        const comment = comments.find(c => c.id === input.commentId);
        
        if (!comment) {
          throw new Error("Comment not found");
        }
        
        const trial = await db.getTrialById(comment.trialId);
        if (!trial) {
          throw new Error("Trial not found");
        }
        
        // Generate document content
        const content = generateMarkdownDocument(trial, comment);
        
        // For now, all formats export as markdown
        // In production, you would use libraries like:
        // - pdf-lib or pdfkit for PDF generation
        // - docx for Word document generation
        const fileBuffer = Buffer.from(content, "utf-8");
        const mimeType = getMimeType(input.format);
        const extension = getFileExtension(input.format);
        
        // Upload to S3
        const fileName = `comment-${comment.id}-${Date.now()}.${extension}`;
        const fileKey = `exports/${ctx.user.id}/${fileName}`;
        const { url } = await storagePut(fileKey, fileBuffer, mimeType);
        
        // Save export record
        await db.insertExportedDocument({
          userId: ctx.user.id,
          trialId: comment.trialId,
          commentId: comment.id,
          documentType: input.format,
          fileKey,
          fileUrl: url,
          fileName
        });
        
        return {
          url,
          fileName
        };
      })
  }),

  subscriptions: router({
    // Get user's subscriptions
    getMy: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getSubscriptionsByUserId(ctx.user.id);
      }),

    // Create subscription
    create: protectedProcedure
      .input(z.object({
        subscriptionName: z.string(),
        journals: z.array(z.string()).optional(),
        trialPhases: z.array(z.enum(["I", "II", "III"])).optional(),
        indications: z.array(z.string()).optional(),
        keywords: z.array(z.string()).optional(),
        emailNotification: z.boolean().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const subscriptionId = await db.insertSubscription({
          userId: ctx.user.id,
          subscriptionName: input.subscriptionName,
          journals: input.journals ? JSON.stringify(input.journals) : null,
          trialPhases: input.trialPhases ? JSON.stringify(input.trialPhases) : null,
          indications: input.indications ? JSON.stringify(input.indications) : null,
          keywords: input.keywords ? JSON.stringify(input.keywords) : null,
          emailNotification: input.emailNotification ? 1 : 0,
          notificationEnabled: 1
        });
        
        return { subscriptionId };
      }),

    // Update subscription
    update: protectedProcedure
      .input(z.object({
        subscriptionId: z.number(),
        subscriptionName: z.string().optional(),
        journals: z.array(z.string()).optional(),
        trialPhases: z.array(z.enum(["I", "II", "III"])).optional(),
        indications: z.array(z.string()).optional(),
        keywords: z.array(z.string()).optional(),
        emailNotification: z.boolean().optional(),
        notificationEnabled: z.boolean().optional()
      }))
      .mutation(async ({ input }) => {
        const updates: any = {};
        
        if (input.subscriptionName) updates.subscriptionName = input.subscriptionName;
        if (input.journals) updates.journals = JSON.stringify(input.journals);
        if (input.trialPhases) updates.trialPhases = JSON.stringify(input.trialPhases);
        if (input.indications) updates.indications = JSON.stringify(input.indications);
        if (input.keywords) updates.keywords = JSON.stringify(input.keywords);
        if (input.emailNotification !== undefined) updates.emailNotification = input.emailNotification ? 1 : 0;
        if (input.notificationEnabled !== undefined) updates.notificationEnabled = input.notificationEnabled ? 1 : 0;
        
        await db.updateSubscription(input.subscriptionId, updates);
        return { success: true };
      }),

    // Delete subscription
    delete: protectedProcedure
      .input(z.object({
        subscriptionId: z.number()
      }))
      .mutation(async ({ input }) => {
        await db.deleteSubscription(input.subscriptionId);
        return { success: true };
      })
  }),

  notes: router({
    // Get notes for a trial
    getForTrial: protectedProcedure
      .input(z.object({
        trialId: z.number()
      }))
      .query(async ({ input, ctx }) => {
        return await db.getNotesByTrialAndUser(input.trialId, ctx.user.id);
      }),

    // Create note
    create: protectedProcedure
      .input(z.object({
        trialId: z.number(),
        noteText: z.string(),
        tags: z.array(z.string()).optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const noteId = await db.insertUserNote({
          userId: ctx.user.id,
          trialId: input.trialId,
          noteText: input.noteText,
          tags: input.tags ? JSON.stringify(input.tags) : null
        });
        
        return { noteId };
      }),

    // Update note
    update: protectedProcedure
      .input(z.object({
        noteId: z.number(),
        noteText: z.string(),
        tags: z.array(z.string()).optional()
      }))
      .mutation(async ({ input }) => {
        await db.updateUserNote(
          input.noteId,
          input.noteText,
          input.tags ? JSON.stringify(input.tags) : undefined
        );
        return { success: true };
      }),

    // Delete note
    delete: protectedProcedure
      .input(z.object({
        noteId: z.number()
      }))
      .mutation(async ({ input }) => {
        await db.deleteUserNote(input.noteId);
        return { success: true };
      })
  }),

  exports: router({
    // Get user's export history
    getMy: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getExportedDocumentsByUserId(ctx.user.id);
      })
  }),

  // PubMed Integration
  pubmed: router({
    // Search PubMed for clinical trials (2025+)
    search: publicProcedure
      .input(z.object({
        keyword: z.string().optional(),
        journal: z.string().optional(),
        maxResults: z.number().optional().default(20)
      }))
      .query(async ({ input }) => {
        const { pmids, count } = await searchClinicalTrials({
          ...input,
          startDate: "2025/01/01" // Only 2025+ trials
        });
        
        // Fetch details for the PMIDs
        const articles = await fetchArticleDetails(pmids);
        
        return {
          articles: articles.map(article => ({
            ...article,
            pdfUrl: getPDFDownloadLink(article),
            submissionUrl: getJournalSubmissionUrl(article.journal)
          })),
          totalCount: count
        };
      }),
    
    // Import trial from PubMed with PDF full text analysis
    importTrial: protectedProcedure
      .input(z.object({
        pmid: z.string(),
        title: z.string(),
        abstract: z.string(),
        journal: z.string(),
        doi: z.string().optional(),
        pmcId: z.string().optional(),
        fullTextUrl: z.string().optional(),
        publicationDate: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        // Try to get PDF URL
        const pdfUrl = getPDFUrl({
          pmcId: input.pmcId,
          doi: input.doi,
          fullTextUrl: input.fullTextUrl
        });

        let fullTextContent = input.abstract;
        let pdfStorageUrl: string | undefined;

        // If PDF URL available, download and process
        if (pdfUrl) {
          const pdfResult = await processPDF(pdfUrl, input.pmid);
          
          if (pdfResult.storageUrl) {
            pdfStorageUrl = pdfResult.storageUrl;
          }
          
          // Use full text if extraction succeeded, otherwise fallback to abstract
          if (pdfResult.fullText && pdfResult.fullText.length > input.abstract.length) {
            fullTextContent = pdfResult.fullText;
          }
        }

        // Import into database using existing import function
        const trialId = await importTrialManually({
          title: input.title,
          authors: "Imported from PubMed", // Will be updated by NLP
          journal: input.journal,
          trialPhase: "III", // Default, will be extracted by NLP
          doi: input.doi,
          pubmedId: input.pmid,
          abstractText: fullTextContent, // Use full text if available
          fullTextUrl: pdfStorageUrl,
          publicationDate: new Date(input.publicationDate)
        });
        
        return { 
          trialId, 
          success: true,
          pdfProcessed: !!pdfStorageUrl,
          fullTextExtracted: fullTextContent !== input.abstract
        };
      })
  })
});

export type AppRouter = typeof appRouter;
