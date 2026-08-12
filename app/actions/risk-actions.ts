"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma"; // Adjust path if your shared Prisma instance is located elsewhere

// Helper to compute intensity and assessment text
function calculateRiskMetrics(probability: number, impact: number) {
  const intensity = parseFloat((probability * impact).toFixed(2));
  let assessment = "Low Risk";

  if (intensity >= 3.0) {
    assessment = "High Risk";
  } else if (intensity >= 2.0) {
    assessment = "Medium Risk";
  }

  return { intensity, assessment };
}

export type CreateRiskInput = {
  riskCategory: string;
  riskDescription: string;
  probability: number;
  impact: number;
  responseStrategy: string;
  riskOwner: string;
  status: string;
};

export type UpdateRiskInput = Partial<CreateRiskInput> & {
  id: string;
};

/**
 * Fetch all Risk records, ordered by timestamp descending
 */
export async function getRisks() {
  try {
    const risks = await prisma.risk.findMany({
      orderBy: {
        timestamp: "desc",
      },
    });
    return { success: true, data: risks };
  } catch (error) {
    console.error("Error fetching risks:", error);
    return { success: false, error: "Failed to fetch risk records." };
  }
}

/**
 * Create a new Risk record
 */
export async function createRisk(input: CreateRiskInput) {
  try {
    const prob = Number(input.probability);
    const imp = Number(input.impact);
    const { intensity, assessment } = calculateRiskMetrics(prob, imp);

    const newRisk = await prisma.risk.create({
      data: {
        riskCategory: input.riskCategory,
        riskDescription: input.riskDescription,
        probability: prob,
        impact: imp,
        riskIntensity: intensity,
        riskAssessment: assessment,
        responseStrategy: input.responseStrategy,
        riskOwner: input.riskOwner,
        status: input.status,
      },
    });

    revalidatePath("/features/risks");
    return { success: true, data: newRisk };
  } catch (error) {
    console.error("Error creating risk:", error);
    return { success: false, error: "Failed to create risk record." };
  }
}

/**
 * Update an existing Risk record
 */
export async function updateRisk(input: UpdateRiskInput) {
  try {
    const { id, ...dataToUpdate } = input;

    // Fetch existing risk to recalculate metrics if probability or impact changed
    const existingRisk = await prisma.risk.findUnique({
      where: { id },
    });

    if (!existingRisk) {
      return { success: false, error: "Risk record not found." };
    }

    const prob =
      dataToUpdate.probability !== undefined
        ? Number(dataToUpdate.probability)
        : existingRisk.probability;
    const imp =
      dataToUpdate.impact !== undefined
        ? Number(dataToUpdate.impact)
        : existingRisk.impact;
    const { intensity, assessment } = calculateRiskMetrics(prob, imp);

    const updatedRisk = await prisma.risk.update({
      where: { id },
      data: {
        ...dataToUpdate,
        probability: prob,
        impact: imp,
        riskIntensity: intensity,
        riskAssessment: assessment,
      },
    });

    revalidatePath("/features/risks");
    return { success: true, data: updatedRisk };
  } catch (error) {
    console.error("Error updating risk:", error);
    return { success: false, error: "Failed to update risk record." };
  }
}

/**
 * Delete a Risk record
 */
export async function deleteRisk(id: string) {
  try {
    await prisma.risk.delete({
      where: { id },
    });

    revalidatePath("/features/risks");
    return { success: true };
  } catch (error) {
    console.error("Error deleting risk:", error);
    return { success: false, error: "Failed to delete risk record." };
  }
}