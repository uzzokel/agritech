"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { tavily } from "@tavily/core";

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Retrieves all advisory queries and active agricultural alerts from PostgreSQL via Prisma
 */
export async function getAdvisoryData() {
  try {
    const queries = await prisma.advisoryQuery.findMany({
      orderBy: { createdAt: "desc" },
    });

    const alerts = await prisma.agriculturalAlert.findMany({
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      queries,
      alerts,
    };
  } catch (error: any) {
    console.error("Error fetching advisory data from Prisma:", error);
    return {
      success: false,
      queries: [],
      alerts: [],
      error: "Failed to load advisory data.",
    };
  }
}

/**
 * Handles farmer questions using Tavily Search API and persists to Prisma
 */
export async function askAdvisoryQuestion(formData: FormData): Promise<ActionResult> {
  try {
    const question = formData.get("question") as string;
    const cropOrTopic =
      (formData.get("cropOrTopic") as string) ||
      (formData.get("farmerName") as string) ||
      "General Agriculture";
    const location = (formData.get("location") as string) || "Nigeria";
    const authorName = (formData.get("authorName") as string) || "Anonymous Farmer";
    const authorEmail = (formData.get("authorEmail") as string) || "";

    if (!question) {
      return { success: false, error: "Please enter your question." };
    }

    let aiAnswer: string | null = null;
    const tavilyKey = process.env.TAVILY_API_KEY;

    if (tavilyKey) {
      try {
        const tvly = tavily({ apiKey: tavilyKey });

        // Construct targeted tropical agriculture search query tailored for Nigerian context
        const searchQuery = `${cropOrTopic} ${question} agricultural advice ${location}`;

        const searchResponse = await tvly.search(searchQuery, {
          searchDepth: "basic",
          maxResults: 3,
          includeAnswer: true,
        });

        if (searchResponse.answer) {
          aiAnswer = searchResponse.answer;
        } else if (searchResponse.results && searchResponse.results.length > 0) {
          aiAnswer = searchResponse.results[0].content;
        } else {
          aiAnswer = `Automatic Advisory Note: We have logged your query regarding ${cropOrTopic || "your farm"}. An extension officer will review it shortly.`;
        }
      } catch (searchError: any) {
        console.error("Tavily search API error details:", {
          message: searchError.message,
          keyPresent: Boolean(tavilyKey),
        });

        aiAnswer = `Automatic Advisory Note: We have logged your query about ${
          cropOrTopic || "your farm"
        }. A human extension agent will review your details and respond shortly.`;
      }
    } else {
      console.warn("TAVILY_API_KEY is not defined in process.env");
      aiAnswer = `Automatic Advisory Note: We have logged your query about ${
        cropOrTopic || "your farm"
      }. A human extension agent will review your details and respond shortly.`;
    }

    const newQuery = await prisma.advisoryQuery.create({
      data: {
        question,
        cropOrTopic,
        location,
        authorName,
        authorEmail,
        aiAnswer,
        status: (aiAnswer && !aiAnswer.startsWith("Automatic Advisory Note") ? "AI_ANSWERED" : "PENDING") as any,
      },
    });

    revalidatePath("/blog");
    revalidatePath("/advisories");
    return { success: true, data: newQuery };
  } catch (error: any) {
    console.error("Error asking question:", error);
    return { success: false, error: error.message || "Failed to submit question." };
  }
}

/**
 * Adds an expert/admin reply to an advisory query in Prisma
 */
export async function replyToQuery(queryId: string, replyMessage: string): Promise<ActionResult> {
  try {
    const updatedQuery = await prisma.advisoryQuery.update({
      where: { id: queryId },
      data: {
        expertReply: replyMessage,
        status: "EXPERT_REPLIED" as any,
      },
    });

    revalidatePath("/blog");
    revalidatePath("/advisories");
    return { success: true, data: updatedQuery };
  } catch (error: any) {
    console.error("Error replying to query:", error);
    return { success: false, error: "Failed to submit expert reply." };
  }
}

/**
 * Adds human agent contribution/reply using FormData
 */
export async function addAgentReplyToQuery(formData: FormData): Promise<ActionResult> {
  try {
    const queryId = formData.get("queryId") as string;
    const agentAnswer = formData.get("agentAnswer") as string;
    const answeredBy = formData.get("answeredBy") as string;

    if (!queryId || !agentAnswer) {
      return { success: false, error: "Missing query ID or answer text." };
    }

    const updatedQuery = await prisma.advisoryQuery.update({
      where: { id: queryId },
      data: {
        agentAnswer,
        answeredBy: answeredBy || "Verified Expert",
        status: "EXPERT_REPLIED" as any,
      },
    });

    revalidatePath("/blog");
    revalidatePath("/advisories");
    return { success: true, data: updatedQuery };
  } catch (error: any) {
    console.error("Error saving human agent contribution:", error);
    return { success: false, error: "Failed to save agent reply." };
  }
}

/**
 * Deletes an irrelevant advisory query thread (Admin control)
 */
export async function deleteAdvisoryQuery(queryId: string): Promise<ActionResult> {
  try {
    if (!queryId) {
      return { success: false, error: "Invalid query ID." };
    }

    await prisma.advisoryQuery.delete({
      where: { id: queryId },
    });

    revalidatePath("/blog");
    revalidatePath("/advisories");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting advisory query:", error);
    return { success: false, error: "Failed to delete query." };
  }
}

/**
 * Posts a new agricultural alert to Prisma
 */
export async function postAgriAlert(alertData: {
  title: string;
  severity: string;
  content: string;
}): Promise<ActionResult> {
  try {
    const newAlert = await prisma.agriculturalAlert.create({
      data: {
        title: alertData.title,
        severity: alertData.severity as any,
        content: alertData.content,
        category: "WEATHER",
      },
    });

    revalidatePath("/blog");
    revalidatePath("/advisories");
    return { success: true, data: newAlert };
  } catch (error: any) {
    console.error("Error creating alert:", error);
    return { success: false, error: "Failed to post alert." };
  }
}