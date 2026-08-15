import { prisma } from "@/lib/prisma";
import UploadWorkPlanClient, { WorkPlanItem } from "./UploadWorkPlanClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  // 1. Fetch saved items from the WorkPlan table on every refresh
  const dbItems = await prisma.workPlan.findMany({
    orderBy: { createdAt: "desc" },
  });

  // 2. Format database numbers properly for the client component
  const initialItems: WorkPlanItem[] = dbItems.map((item) => ({
    id: item.id,
    componentName: item.componentName,
    budgetCategory: item.budgetCategory || "",
    state: item.state || "",
    description: item.description,
    detailedCalculation: item.detailedCalculation,
    unitCost: Number(item.unitCost ?? 0),
    quantity: Number(item.quantity ?? 0),
    totalCostEstimate: Number(item.totalCostEstimate),
    currency: item.currency,
    timeFrame: item.timeFrame,
    expectedOutput: item.expectedOutput,
  }));

  // 3. Render your exact form and table with the pre-loaded data
  return <UploadWorkPlanClient initialItems={initialItems} />;
}