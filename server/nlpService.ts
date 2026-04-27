import { invokeLLM } from "./_core/llm";
import { Trial } from "../drizzle/schema";

/**
 * Extract structured information from trial abstract using LLM
 */
export async function extractTrialInformation(abstractText: string, title: string): Promise<{
  indication: string;
  sampleSize: number | null;
  randomization: string;
  blinding: string;
  primaryEndpoint: string;
  secondaryEndpoint: string;
  keyResults: string;
  statisticalMetrics: string;
  conclusion: string;
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert clinical trial analyst. Extract structured information from clinical trial abstracts with precision and accuracy."
      },
      {
        role: "user",
        content: `Extract the following information from this clinical trial:

Title: ${title}

Abstract: ${abstractText}

Please extract:
1. Indication/disease being studied
2. Sample size (number of participants)
3. Randomization method
4. Blinding approach
5. Primary endpoint
6. Secondary endpoints
7. Key results summary
8. Statistical metrics (HR, CI, P-values, etc.)
9. Main conclusion

Return the information in a structured format.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "trial_extraction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            indication: { type: "string", description: "Disease or condition being studied" },
            sampleSize: { type: ["number", "null"], description: "Total number of participants" },
            randomization: { type: "string", description: "Randomization method description" },
            blinding: { type: "string", description: "Blinding approach (open-label, single-blind, double-blind, etc.)" },
            primaryEndpoint: { type: "string", description: "Primary outcome measure" },
            secondaryEndpoint: { type: "string", description: "Secondary outcome measures" },
            keyResults: { type: "string", description: "Summary of key findings" },
            statisticalMetrics: { type: "string", description: "HR, CI, P-values and other statistical measures in JSON format" },
            conclusion: { type: "string", description: "Main conclusion of the study" }
          },
          required: ["indication", "sampleSize", "randomization", "blinding", "primaryEndpoint", "secondaryEndpoint", "keyResults", "statisticalMetrics", "conclusion"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    console.error("[NLP Service] Invalid LLM response:", response);
    throw new Error("Failed to extract trial information: Invalid LLM response");
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("[NLP Service] Failed to parse JSON:", content);
    throw new Error("Failed to parse trial information JSON");
  }
}

/**
 * Identify methodological flaws in a clinical trial
 */
export async function identifyMethodologicalFlaws(trial: Trial): Promise<Array<{
  category: "allocation_concealment" | "blinding_issues" | "missing_data" | "statistical_power" | "multiple_comparison" | "endpoint_substitution" | "other";
  riskLevel: "high" | "medium" | "low";
  description: string;
  evidence: string;
}>> {
  const trialContext = `
Title: ${trial.title}
Journal: ${trial.journal}
Phase: ${trial.trialPhase}
Sample Size: ${trial.sampleSize || "Not specified"}
Randomization: ${trial.randomization || "Not specified"}
Blinding: ${trial.blinding || "Not specified"}
Primary Endpoint: ${trial.primaryEndpoint || "Not specified"}
Secondary Endpoint: ${trial.secondaryEndpoint || "Not specified"}
Key Results: ${trial.keyResults || "Not specified"}
Statistical Metrics: ${trial.statisticalMetrics || "Not specified"}
Abstract: ${trial.abstractText || "Not available"}
`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert methodologist specializing in clinical trial design and statistical analysis. Your task is to identify potential methodological flaws and biases in clinical trials.

Focus on these categories:
- allocation_concealment: Issues with allocation concealment or sequence generation
- blinding_issues: Problems with blinding of participants, personnel, or outcome assessors
- missing_data: Inadequate handling of missing data or intention-to-treat analysis
- statistical_power: Insufficient sample size or statistical power
- multiple_comparison: Multiple comparisons without appropriate correction
- endpoint_substitution: Using secondary endpoints to replace primary endpoints
- other: Other methodological concerns

For each flaw, assess risk level:
- high: Serious flaw that may significantly bias results
- medium: Moderate concern that could affect interpretation
- low: Minor issue with limited impact

Be evidence-based and cite specific information from the trial description.`
      },
      {
        role: "user",
        content: `Analyze this clinical trial for potential methodological flaws:

${trialContext}

Identify all potential methodological issues, categorize them, assess risk level, and provide evidence from the trial information.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "methodological_flaws",
        strict: true,
        schema: {
          type: "object",
          properties: {
            flaws: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: ["allocation_concealment", "blinding_issues", "missing_data", "statistical_power", "multiple_comparison", "endpoint_substitution", "other"]
                  },
                  riskLevel: {
                    type: "string",
                    enum: ["high", "medium", "low"]
                  },
                  description: { type: "string" },
                  evidence: { type: "string" }
                },
                required: ["category", "riskLevel", "description", "evidence"],
                additionalProperties: false
              }
            }
          },
          required: ["flaws"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("Failed to identify methodological flaws");
  }

  const result = JSON.parse(content);
  return result.flaws;
}

/**
 * Generate a structured comment/correspondence for a clinical trial
 */
export async function generateComment(trial: Trial, flaws: Array<{
  category: string;
  riskLevel: string;
  description: string;
  evidence: string;
}>): Promise<{
  commentText: string;
  wordCount: number;
}> {
  const flawsSummary = flaws.map(f => 
    `- ${f.category.replace(/_/g, ' ')} (${f.riskLevel} risk): ${f.description}`
  ).join('\n');

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert clinical researcher and medical journal editor specializing in methodological critique and scientific commentary for high-impact journals like NEJM, Lancet, JAMA, and BMJ.

Your task is to generate a publication-ready commentary (EXACTLY 500 words) suitable for submission as a Correspondence or Comment.

**CRITICAL REQUIREMENTS:**
1. **Language**: Write in formal academic English ONLY
2. **Word Count**: EXACTLY 500 words (±10 words acceptable)
3. **Structure**: 
   - Opening (50-70 words): Acknowledge the study's contribution and significance
   - Key Findings Summary (80-100 words): Concisely present main results with specific numbers
   - Methodological Critique (200-250 words): Detailed analysis of design limitations, statistical concerns
   - Clinical Implications (100-120 words): Discuss impact on clinical practice
   - Conclusion (50-70 words): Forward-looking statement about future research needs

4. **Tone**: Professional, constructive, balanced
5. **Evidence-Based**: Cite specific data points, effect sizes, hazard ratios, confidence intervals, P-values
6. **Specificity**: Reference exact numbers from the trial
7. **Format**: Clear paragraph breaks, no bullet points, professional medical writing style
8. **Output**: ONLY the commentary text. Do NOT include title, author names, references, or acknowledgments.`
      },
      {
        role: "user",
        content: `Write a 500-word commentary for submission to ${trial.journal}:

**Trial Information:**
Title: ${trial.title}
Journal: ${trial.journal}
DOI: ${trial.doi || "Not available"}
Phase: ${trial.trialPhase} trial
Indication: ${trial.indication}
Sample Size: N=${trial.sampleSize}
Primary Endpoint: ${trial.primaryEndpoint}
Key Results: ${trial.keyResults}
Conclusion: ${trial.conclusion}

**Methodological Concerns:**
${flawsSummary}

Generate a scholarly commentary suitable for journal submission. Start directly with the opening paragraph.`
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  const commentText = typeof content === 'string' ? content : "";
  const wordCount = commentText.split(/\s+/).length;

  return {
    commentText,
    wordCount
  };
}

/**
 * Generate a concise summary of a clinical trial
 */
export async function generateTrialSummary(trial: Trial): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert medical writer. Create concise, accurate summaries of clinical trials for researchers."
      },
      {
        role: "user",
        content: `Create a 2-3 sentence summary of this clinical trial:

Title: ${trial.title}
Phase: ${trial.trialPhase}
Indication: ${trial.indication}
Sample Size: ${trial.sampleSize}
Key Results: ${trial.keyResults}
Conclusion: ${trial.conclusion}

Focus on the most important findings and clinical implications.`
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  return typeof content === 'string' ? content : "";
}
