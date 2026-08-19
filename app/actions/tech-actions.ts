// app/actions/tech-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FetchTechParams {
  page?: number;
  search?: string;
  state?: string;
  category?: string;
}

// 1. Fetch Tech Adoption Records with Pagination & Filters
export async function getTechAdoptions({ page = 1, search = "", state = "All", category = "All" }: FetchTechParams) {
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const whereClause: any = {};
  if (state !== "All") {
    whereClause.state = state;
  }
  if (category !== "All") {
    whereClause.category = category;
  }
  if (search) {
    whereClause.OR = [
      { technologyName: { contains: search, mode: "insensitive" } },
      { clusterName: { contains: search, mode: "insensitive" } },
      { recordedBy: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, totalCount] = await Promise.all([
    prisma.techAdoption.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.techAdoption.count({ where: whereClause }),
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

// 2. Create Tech Adoption Record (with Supabase Storage Image Upload)
export async function createTechAdoption(formData: FormData) {
  try {
    const file = formData.get("image") as File;
    let imageUrl: string | null = null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("tech-images") // 👈 Make sure to create this bucket in your Supabase project
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError.message);
        return { success: false, error: `Image upload failed: ${uploadError.message}` };
      }

      const { data: publicUrlData } = supabase.storage
        .from("tech-images")
        .getPublicUrl(uploadData.path);

      imageUrl = publicUrlData.publicUrl;
    }

    await prisma.techAdoption.create({
      data: {
        technologyName: formData.get("technologyName") as string,
        category: formData.get("category") as string,
        state: formData.get("state") as string,
        clusterName: formData.get("clusterName") as string,
        adoptionRate: parseFloat(formData.get("adoptionRate") as string) || 0,
        beneficiariesCount: parseInt(formData.get("beneficiariesCount") as string) || 0,
        notes: formData.get("notes") as string,
        recordedBy: (formData.get("recordedBy") as string) || "Extension Officer",
        imageUrl: imageUrl,
      },
    });

    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("Database save error:", error);
    return { success: false, error: "Failed to create technology adoption record." };
  }
}

// 3. Delete Tech Adoption Record (Admin Only)
export async function deleteTechAdoption(id: string, isAdmin: boolean = true) {
  try {
    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Admin access required." };
    }

    await prisma.techAdoption.delete({
      where: { id },
    });

    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete record:", error);
    return { success: false, error: "Database error: Could not delete the record." };
  }
}