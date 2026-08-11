"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface TargetPayload {
  componentName: string;
  expectedOutcomes: string;
  targetPercentage: number;
  baselineValue: number;
  meansOfVerification: string;
  timeFrame: string;
  responsiblePerson: string;
}

export interface ActualPayload {
  targetId: string;
  actualValue: number;
  remarks: string;
}

// Table 1 Actions
export async function createPerformanceTarget(payload: TargetPayload) {
  try {
    const item = await prisma.performanceTarget.create({ data: payload });
    revalidatePath("/performance-planning");
    revalidatePath("/performance-monitoring");
    return { success: true, data: item };
  } catch (error) {
    console.error("Error creating target:", error);
    return { success: false, error: "Failed to save performance target." };
  }
}

export async function getPerformanceTargets() {
  try {
    const items = await prisma.performanceTarget.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: items };
  } catch (error) {
    console.error("Error fetching targets:", error);
    return { success: false, error: "Failed to fetch performance targets." };
  }
}

// Table 2 Actions
export async function createOrUpdateActual(payload: ActualPayload) {
  try {
    // Check if actual already exists for this target
    const existing = await prisma.performanceActual.findFirst({
      where: { targetId: payload.targetId },
    });

    let item;
    if (existing) {
      item = await prisma.performanceActual.update({
        where: { id: existing.id },
        data: { actualValue: payload.actualValue, remarks: payload.remarks },
      });
    } else {
      item = await prisma.performanceActual.create({ data: payload });
    }

    revalidatePath("/performance-monitoring");
    return { success: true, data: item };
  } catch (error) {
    console.error("Error saving actual:", error);
    return { success: false, error: "Failed to save actual performance record." };
  }
}

export async function getPerformanceMonitoringData() {
  try {
    const targets = await prisma.performanceTarget.findMany({
      include: {
        actuals: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: targets };
  } catch (error) {
    console.error("Error fetching monitoring data:", error);
    return { success: false, error: "Failed to load monitoring table." };
  }
}