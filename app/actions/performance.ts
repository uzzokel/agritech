'use server';

let performanceTargets: any[] = [];
let performanceActuals: any[] = [];

export async function getPerformanceTargets(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  return {
    success: true,
    data: performanceTargets,
  };
}

export async function createPerformanceTarget(data: {
  componentName?: string;
  component?: string;
  expectedOutcomes?: string;
  indicator?: string;
  timeFrame?: string;
  baselineValue: number;
  targetPercentage: number;
  unit?: string;
  year?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const newTarget = {
    id: Date.now().toString(),
    ...data,
    actuals: [],
    createdAt: new Date().toISOString(),
  };
  performanceTargets.push(newTarget);
  return { success: true, data: newTarget };
}

export async function getPerformanceMonitoringData(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  const formattedData = performanceTargets.map((target) => {
    const matchingActuals = performanceActuals.filter((a) => a.targetId === target.id);
    return {
      ...target,
      actuals: matchingActuals,
      status: matchingActuals.length > 0 && matchingActuals[0].actualValue >= target.targetPercentage ? 'On Track' : 'Needs Attention',
    };
  });

  return {
    success: true,
    data: formattedData,
  };
}

export async function createOrUpdateActual(data: {
  targetId: string;
  actualValue: number;
  notes?: string;
  remarks?: string;
  status?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const newActual = {
    id: Date.now().toString(),
    ...data,
    updatedAt: new Date().toISOString(),
  };
  performanceActuals.unshift(newActual);

  return { success: true, data: newActual };
}