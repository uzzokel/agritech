"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getLessons() {
  try {
    const lessons = await prisma.lessonLearned.findMany({
      orderBy: {
        timestamp: "desc",
      },
    });
    return { success: true, data: lessons };
  } catch (error: any) {
    console.error("Error fetching lessons:", error);
    return { success: false, error: "Failed to fetch lessons learned records." };
  }
}

export async function createLesson(data: {
  component: string;
  whatWentWrong: string;
  rootCauseAnalysis: string;
  impact: string;
  actionableRecommendation: string;
  actionOwner: string;
}) {
  try {
    const newLesson = await prisma.lessonLearned.create({
      data: {
        component: data.component,
        whatWentWrong: data.whatWentWrong,
        rootCauseAnalysis: data.rootCauseAnalysis,
        impact: data.impact,
        actionableRecommendation: data.actionableRecommendation,
        actionOwner: data.actionOwner,
      },
    });

    revalidatePath("/lessons-learned");
    return { success: true, data: newLesson };
  } catch (error: any) {
    console.error("Error creating lesson:", error);
    return { success: false, error: "Failed to create lesson record." };
  }
}

export async function deleteLesson(id: string) {
  try {
    await prisma.lessonLearned.delete({
      where: { id },
    });

    revalidatePath("/lessons-learned");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting lesson:", error);
    return { success: false, error: "Failed to delete lesson record." };
  }
}