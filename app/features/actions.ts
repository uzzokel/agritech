// app/features/actions.ts
"use server";

import { requireAgriUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createWorkPlanItem(formData: {
  componentName: string;
  budgetCategory: string;
  state: string; // Added state property matching form submission
  description: string;
  detailedCalculation: string;
  unitCost: number;
  quantity: number;
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
        state: formData.state, // Stored directly in the database model
        description: formData.description,
        detailedCalculation: formData.detailedCalculation,
        unitCost: Number(formData.unitCost) || 0,
        quantity: Number(formData.quantity) || 0,
        totalCostEstimate: Number(formData.totalCostEstimate) || 0,
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

    return {
      success: true,
      data: {
        ...newItem,
        unitCost: Number(newItem.unitCost),
        quantity: Number(newItem.quantity),
        totalCostEstimate: Number(newItem.totalCostEstimate),
      },
    };
  } catch (error: any) {
    console.error("Failed to create workplan item:", error);
    return { success: false, error: error.message || "Database write failed" };
  }
}

/**
 * Fetches standalone workplan items directly from Prisma for component initialization.
 * Supports optional pagination parameters for high-volume datasets.
 */
export async function getWorkPlanItems(params?: { page?: number; limit?: number }) {
  try {
    await requireAgriUser();

    const page = params?.page || 1;
    const limit = params?.limit;
    const skip = limit ? (page - 1) * limit : undefined;

    const [items, totalCount] = await Promise.all([
      prisma.workPlan.findMany({
        orderBy: { createdAt: "desc" },
        ...(limit ? { skip, take: limit } : {}),
      }),
      prisma.workPlan.count(),
    ]);

    const serializedData = items.map((item) => ({
      ...item,
      unitCost: Number(item.unitCost),
      quantity: Number(item.quantity),
      totalCostEstimate: Number(item.totalCostEstimate),
    }));

    return {
      success: true,
      data: serializedData,
      pagination: {
        totalCount,
        totalPages: limit ? Math.ceil(totalCount / limit) : 1,
        currentPage: page,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch workplan items:", error);
    return {
      success: false,
      data: [],
      error: error.message,
      pagination: { totalCount: 0, totalPages: 1, currentPage: 1 },
    };
  }
}

/**
 * Fetches workplans with their linked performance records joined.
 * Supports optional pagination parameters.
 */
export async function getWorkPlanItemsWithPerformance(params?: { page?: number; limit?: number }) {
  try {
    await requireAgriUser();

    const page = params?.page || 1;
    const limit = params?.limit;
    const skip = limit ? (page - 1) * limit : undefined;

    const [items, totalCount] = await Promise.all([
      prisma.workPlan.findMany({
        include: {
          performance: true,
        },
        orderBy: { createdAt: "desc" },
        ...(limit ? { skip, take: limit } : {}),
      }),
      prisma.workPlan.count(),
    ]);

    const serializedData = items.map((item) => ({
      ...item,
      unitCost: Number(item.unitCost),
      quantity: Number(item.quantity),
      totalCostEstimate: Number(item.totalCostEstimate),
      performance: item.performance
        ? {
            ...item.performance,
            amountDisbursed: Number(item.performance.amountDisbursed),
          }
        : null,
    }));

    return {
      success: true,
      data: serializedData,
      pagination: {
        totalCount,
        totalPages: limit ? Math.ceil(totalCount / limit) : 1,
        currentPage: page,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch workplan items with performance:", error);
    return {
      success: false,
      data: [],
      error: error.message,
      pagination: { totalCount: 0, totalPages: 1, currentPage: 1 },
    };
  }
}

export async function updatePerformanceItem(
  performanceId: string,
  updates: {
    amountDisbursed?: number;
    actualOutput?: string;
    statusFlag?: string;
  }
) {
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

    return {
      success: true,
      data: {
        ...updated,
        amountDisbursed: Number(updated.amountDisbursed),
        workPlan: updated.workPlan
          ? {
              ...updated.workPlan,
              unitCost: Number(updated.workPlan.unitCost),
              quantity: Number(updated.workPlan.quantity),
              totalCostEstimate: Number(updated.workPlan.totalCostEstimate),
            }
          : null,
      },
    };
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

    const aggregatedMap: Record<
      string,
      { category: string; Target: number; Actual: number }
    > = {};

    workPlans.forEach((item) => {
      const key = item.budgetCategory || "Uncategorized";

      if (!aggregatedMap[key]) {
        aggregatedMap[key] = {
          category: key,
          Target: 0,
          Actual: 0,
        };
      }

      // Sum up Target costs from WorkPlan
      aggregatedMap[key].Target += Number(item.totalCostEstimate) || 0;

      // Sum up Actual disbursed funds from BudgetPerformance
      if (item.performance) {
        aggregatedMap[key].Actual += Number(item.performance.amountDisbursed) || 0;
      }
    });

    return { success: true, data: Object.values(aggregatedMap) };
  } catch (error: any) {
    console.error("Failed to fetch chart data:", error);
    return {
      success: false,
      data: [],
      error: error.message || "Failed to fetch chart data",
    };
  }
}

/* ============================================================================
 * PERFORMANCE TARGET & ACTUAL ACTIONS (Matched to Schema Models)
 * ============================================================================ */

export async function createPerformanceTarget(formData: {
  componentName: string;
  expectedOutcomes: string;
  targetPercentage: number;
  baselineValue: number;
  meansOfVerification: string;
  timeFrame: string;
  responsiblePerson: string;
}) {
  try {
    await requireAgriUser();

    const newTarget = await prisma.performanceTarget.create({
      data: {
        componentName: formData.componentName,
        expectedOutcomes: formData.expectedOutcomes,
        targetPercentage: Number(formData.targetPercentage) || 0,
        baselineValue: Number(formData.baselineValue) || 0,
        meansOfVerification: formData.meansOfVerification,
        timeFrame: formData.timeFrame,
        responsiblePerson: formData.responsiblePerson,
      },
    });

    revalidatePath("/features/kpi");

    return {
      success: true,
      data: newTarget,
    };
  } catch (error: any) {
    console.error("Failed to create performance target:", error);
    return { success: false, error: error.message || "Failed to save target indicator" };
  }
}

export async function getPerformanceTargets() {
  try {
    await requireAgriUser();

    const targets = await prisma.performanceTarget.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: targets };
  } catch (error: any) {
    console.error("Failed to fetch performance targets:", error);
    return { success: false, data: [], error: error.message };
  }
}

export async function createOrUpdatePerformanceActual(formData: {
  targetId: string;
  actualValue: number;
  remarks?: string;
}) {
  try {
    await requireAgriUser();

    // Check if an actual record already exists for this targetId
    const existingActual = await prisma.performanceActual.findFirst({
      where: { targetId: formData.targetId },
      orderBy: { createdAt: "desc" },
    });

    let actual;
    if (existingActual) {
      actual = await prisma.performanceActual.update({
        where: { id: existingActual.id },
        data: {
          actualValue: Number(formData.actualValue) || 0,
          remarks: formData.remarks || null,
        },
      });
    } else {
      actual = await prisma.performanceActual.create({
        data: {
          targetId: formData.targetId,
          actualValue: Number(formData.actualValue) || 0,
          remarks: formData.remarks || null,
        },
      });
    }

    revalidatePath("/features/kpi");

    return {
      success: true,
      data: actual,
    };
  } catch (error: any) {
    console.error("Failed to record performance actuals:", error);
    return { success: false, error: error.message || "Failed to record actual progress" };
  }
}

export async function getPerformanceMonitoringData() {
  try {
    await requireAgriUser();

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
  } catch (error: any) {
    console.error("Failed to fetch monitoring data:", error);
    return { success: false, data: [], error: error.message };
  }
}