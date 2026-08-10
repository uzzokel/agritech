// app/features/actions.ts
"use server";

import { requireAgriUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createWorkPlanItem(formData: {
  componentName: string;
  budgetCategory: string;
  description: string;
  detailedCalculation: string;
  totalCostEstimate: number;
  currency: string;
  timeFrame: string;
  expectedOutput: string;
}) {
  try {
    await requireAgriUser();

    // Create the workplan item and automatically initialize its linked performance record
    const newItem = await prisma.workPlan.create({
      data: {
        componentName: formData.componentName,
        budgetCategory: formData.budgetCategory,
        description: formData.description,
        detailedCalculation: formData.detailedCalculation,
        totalCostEstimate: Number(formData.totalCostEstimate),
        currency: formData.currency || "USD",
        timeFrame: formData.timeFrame,
        expectedOutput: formData.expectedOutput,
        performance: {
          create: {
            amountDisbursed: 0.0,
            statusFlag: "GREEN",
          },
        },
      },
      include: {
        performance: true,
      },
    });

    revalidatePath("/features");
    return { success: true, data: newItem };
  } catch (error: any) {
    console.error("Failed to create workplan item:", error);
    return { success: false, error: error.message || "Database write failed" };
  }
}

export async function getWorkPlanItemsWithPerformance() {
  try {
    await requireAgriUser();
    // Fetch workplans with their linked performance records joined
    const items = await prisma.workPlan.findMany({
      include: {
        performance: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: items };
  } catch (error: any) {
    console.error("Failed to fetch workplan items:", error);
    return { success: false, data: [], error: error.message };
  }
}

export async function updatePerformanceItem(performanceId: string, updates: {
  amountDisbursed?: number;
  actualOutput?: string;
  statusFlag?: string;
}) {
  try {
    await requireAgriUser();

    const updated = await prisma.budgetPerformance.update({
      where: { id: performanceId },
      data: updates,
      include: {
        workPlan: true,
      },
    });

    revalidatePath("/features");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Failed to update performance record:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Aggregates WorkPlan totalCostEstimate (Target) and BudgetPerformance amountDisbursed (Actual)
 * grouped by budgetCategory for the Line Chart visualization.
 */
export async function getPerformanceChartData() {
  try {
    await requireAgriUser();

    const workPlans = await prisma.workPlan.findMany({
      include: {
        performance: true,
      },
    });

    const aggregatedMap: Record<string, { category: string; Target: number; Actual: number }> = {};

    workPlans.forEach((item) => {
      const key = item.budgetCategory;

      if (!aggregatedMap[key]) {
        aggregatedMap[key] = {
          category: key,
          Target: 0,
          Actual: 0,
        };
      }

      // Sum up Target costs from WorkPlan
      aggregatedMap[key].Target += item.totalCostEstimate || 0;

      // Sum up Actual disbursed funds from BudgetPerformance
      if (item.performance) {
        aggregatedMap[key].Actual += item.performance.amountDisbursed || 0;
      }
    });

    return { success: true, data: Object.values(aggregatedMap) };
  } catch (error: any) {
    console.error("Failed to fetch chart data:", error);
    return { success: false, data: [], error: error.message || "Failed to fetch chart data" };
  }
}