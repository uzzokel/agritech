// app/actions/policy-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FetchParams {
  page?: number;
  search?: string;
  state?: string;
}

// 1. Fetch Success Stories with Pagination
export async function getSuccessStories({ page = 1, search = "", state = "All" }: FetchParams) {
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const whereClause: any = {};
  if (state !== "All") {
    whereClause.state = state;
  }
  if (search) {
    whereClause.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { clusterName: { contains: search, mode: "insensitive" } },
      { userGroup: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, totalCount] = await Promise.all([
    prisma.successStory.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.successStory.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startItem = totalCount === 0 ? 0 : skip + 1;
  const endItem = Math.min(skip + pageSize, totalCount);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      startItem,
      endItem,
    },
  };
}

// 2. Fetch Routine Performance Data with Pagination
export async function getRoutinePerformance({ page = 1, search = "", state = "All" }: FetchParams) {
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const whereClause: any = {};
  if (state !== "All") {
    whereClause.state = state;
  }
  if (search) {
    whereClause.OR = [
      { kpi: { contains: search, mode: "insensitive" } },
      { quarter: { contains: search, mode: "insensitive" } },
      { year: { contains: search, mode: "insensitive" } },
    ];
  }

  const [rawMetrics, totalCount] = await Promise.all([
    prisma.routinePerformance.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.routinePerformance.count({ where: whereClause }),
  ]);

  // Compute calculated metrics (% achieved, variance, flag)
  const data = rawMetrics.map((item) => {
    const pct = item.target > 0 ? Math.round((item.achievement / item.target) * 100) : 0;
    const variance = item.achievement - item.target;
    let flag = "Green";
    if (pct < 40) flag = "Red";
    else if (pct <= 69) flag = "Amber";

    return {
      ...item,
      pct,
      variance,
      flag,
    };
  });

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startItem = totalCount === 0 ? 0 : skip + 1;
  const endItem = Math.min(skip + pageSize, totalCount);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      startItem,
      endItem,
    },
  };
}

// 3. Export Data to CSV Action
export async function exportPolicyDataToCsv(type: "stories" | "routine", state = "All") {
  const whereClause: any = state !== "All" ? { state } : {};

  if (type === "stories") {
    const records = await prisma.successStory.findMany({ where: whereClause });
    const headers = ["ID", "Full Name", "State", "Cluster Name", "User Group", "Location", "GPS", "Image URL", "Narration", "Created At"];
    const rows = records.map((r) => [
      r.id,
      `"${r.fullName}"`,
      `"${r.state}"`,
      `"${r.clusterName || ""}"`,
      `"${r.userGroup || ""}"`,
      `"${r.location || ""}"`,
      `"${r.gps || ""}"`,
      `"${r.imageUrl || ""}"`,
      `"${r.narration.replace(/"/g, '""')}"`,
      r.createdAt.toISOString(),
    ]);
    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  } else {
    const records = await prisma.routinePerformance.findMany({ where: whereClause });
    const headers = ["State", "Quarter", "Year", "KPI", "Baseline", "Target", "Achievement", "% Achieved", "Variance", "Flag"];
    const rows = records.map((r) => {
      const pct = r.target > 0 ? Math.round((r.achievement / r.target) * 100) : 0;
      const variance = r.achievement - r.target;
      let flag = "Green";
      if (pct < 40) flag = "Red";
      else if (pct <= 69) flag = "Amber";

      return [
        `"${r.state}"`,
        r.quarter,
        r.year,
        `"${r.kpi}"`,
        r.baseline,
        r.target,
        r.achievement,
        `${pct}%`,
        variance,
        flag,
      ];
    });
    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  }
}

// 4. Create Success Story Action (with Supabase Image Upload)
export async function createSuccessStory(formData: FormData) {
  try {
    const file = formData.get("image") as File;
    let imageUrl: string | null = null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("policy-images")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError.message);
        return { success: false, error: `Image upload failed: ${uploadError.message}` };
      }

      const { data: publicUrlData } = supabase.storage
        .from("policy-images")
        .getPublicUrl(uploadData.path);

      imageUrl = publicUrlData.publicUrl;
    }

    await prisma.successStory.create({
      data: {
        fullName: formData.get("fullName") as string,
        state: formData.get("state") as string,
        clusterName: formData.get("clusterName") as string,
        userGroup: formData.get("userGroup") as string,
        location: formData.get("location") as string,
        gps: formData.get("gps") as string,
        imageUrl: imageUrl,
        narration: (formData.get("netNarration") as string) || (formData.get("narration") as string),
      },
    });

    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("Database save error:", error);
    return { success: false, error: "Failed to create success story." };
  }
}

// 5. Create Routine Performance Action
export async function createRoutinePerformance(formData: FormData) {
  try {
    await prisma.routinePerformance.create({
      data: {
        state: formData.get("state") as string,
        quarter: formData.get("quarter") as string,
        year: formData.get("year") as string,
        kpi: formData.get("kpi") as string,
        baseline: parseFloat(formData.get("baseline") as string) || 0,
        target: parseFloat(formData.get("target") as string) || 0,
        achievement: parseFloat(formData.get("achievement") as string) || 0,
      },
    });
    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to create routine performance record." };
  }
}

// 6. Delete Policy Record Action (Admin Only)
export async function deletePolicyRecord(tab: "stories" | "routine", id: string, isAdmin: boolean = true) {
  try {
    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Admin access required." };
    }

    if (tab === "stories") {
      await prisma.successStory.delete({
        where: { id },
      });
    } else {
      await prisma.routinePerformance.delete({
        where: { id },
      });
    }

    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete record:", error);
    return { success: false, error: "Database error: Could not delete the record." };
  }
}