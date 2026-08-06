"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==========================================
// AUTHENTICATION HELPER
// ==========================================

async function verifyAgriSessionOrThrow() {
  const cookieStore = await cookies();
  const agriVerified = cookieStore.get("agri_session_verified")?.value;
  const agriSessionId = cookieStore.get("agri_session_id")?.value;

  if (agriVerified === "true" && agriSessionId) {
    return; // Valid session cookies found
  }

  // Fallback check: Is user an admin via Clerk?
  const { userId, sessionClaims } = await auth();
  const ADMIN_EMAIL = "uzzokel@gmail.com";
  const userEmail =
    (sessionClaims?.email as string) ||
    (sessionClaims?.primaryEmail as string) ||
    (sessionClaims?.email_address as string);

  if (userId && userEmail === ADMIN_EMAIL) {
    return; // Admin bypass allowed
  }

  throw new Error("Unauthorized: Missing valid agricultural ID and PIN session.");
}

// ==========================================
// USER REPORT ACTIONS
// ==========================================

export async function uploadUserReportAction(formData: FormData) {
  try {
    await verifyAgriSessionOrThrow();

    const authorName = formData.get("authorName") as string;
    const role = formData.get("role") as string;
    const state = formData.get("state") as string;
    const file = formData.get("file") as File;

    if (!file) return { success: false, error: "No file provided" };

    const filePath = `field_uploads/${Date.now()}_${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: storageError } = await supabase.storage
      .from("report_documents")
      .upload(filePath, buffer, { contentType: file.type, upsert: false });

    if (storageError) return { success: false, error: storageError.message };

    const { data: publicUrlData } = supabase.storage
      .from("report_documents")
      .getPublicUrl(filePath);

    await prisma.userReport.create({
      data: {
        authorName,
        role,
        state,
        fileName: file.name,
        fileUrl: publicUrlData.publicUrl,
      },
    });

    revalidatePath("/dashboard/reports");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to process upload" };
  }
}

export async function fetchUserReportsAction() {
  try {
    await verifyAgriSessionOrThrow();

    const reports = await prisma.userReport.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: reports };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

export async function deleteUserReportAction(id: string, userRole: string) {
  try {
    await verifyAgriSessionOrThrow();

    if (userRole !== "admin") {
      return { success: false, error: "Unauthorized: Only administrators can delete reports." };
    }

    const report = await prisma.userReport.findUnique({ where: { id } });
    
    if (report && report.fileUrl) {
      const urlParts = report.fileUrl.split("/report_documents/");
      if (urlParts.length > 1) {
        await supabase.storage.from("report_documents").remove([urlParts[1]]);
      }
    }

    await prisma.userReport.delete({ where: { id } });

    revalidatePath("/dashboard/reports");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==========================================
// ADMIN REPORT ACTIONS
// ==========================================

export async function uploadAdminReportAction(formData: FormData, userRole: string) {
  try {
    await verifyAgriSessionOrThrow();

    if (userRole !== "admin") {
      return { success: false, error: "Unauthorized: Only administrators can publish master reports." };
    }

    const execSummary = formData.get("execSummary") as string;
    const keyMetrics = formData.get("keyMetrics") as string;
    const recommendations = formData.get("recommendations") as string;
    const file = formData.get("file") as File | null;

    // Check if an existing summary already exists so we can reuse its file if no new file is uploaded
    const existingSummary = await prisma.adminReportSummary.findFirst({
      orderBy: { createdAt: "desc" },
    });

    let fileUrl = existingSummary?.fileUrl || "";
    let fileName = existingSummary?.fileName || "";

    if (file && file.size > 0) {
      const filePath = `admin_uploads/${Date.now()}_${file.name}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: storageError } = await supabase.storage
        .from("admin_reports")
        .upload(filePath, buffer, { contentType: file.type, upsert: false });

      if (storageError) return { success: false, error: storageError.message };

      const { data: publicUrlData } = supabase.storage
        .from("admin_reports")
        .getPublicUrl(filePath);

      fileUrl = publicUrlData.publicUrl;
      fileName = file.name;
    }

    if (!fileUrl) {
      return { success: false, error: "No master report file provided" };
    }

    await prisma.adminReportSummary.deleteMany({});

    const newSummary = await prisma.adminReportSummary.create({
      data: {
        execSummary,
        keyMetrics: keyMetrics || "",
        recommendations: recommendations || "",
        fileName,
        fileUrl,
      },
      include: {
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    revalidatePath("/dashboard/reports");
    return { success: true, data: newSummary };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to process admin upload" };
  }
}

export async function fetchAdminReportAction() {
  try {
    await verifyAgriSessionOrThrow();

    const summary = await prisma.adminReportSummary.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return { success: true, data: summary };
  } catch (err: any) {
    return { success: false, data: null, error: err.message };
  }
}

// ==========================================
// ADMIN REPORT COMMENT ACTIONS
// ==========================================

export async function createAdminReportCommentAction(data: {
  summaryId: string;
  authorName: string;
  authorRole: string;
  content: string;
  userId?: string | null;
}) {
  try {
    await verifyAgriSessionOrThrow();

    if (!data.summaryId || !data.content) {
      return { success: false, error: "Missing required comment fields." };
    }

    // Safely create comment matching optional relation fields
    const comment = await prisma.adminReportComment.create({
      data: {
        summaryId: data.summaryId,
        authorName: data.authorName,
        authorRole: data.authorRole,
        content: data.content,
        userId: data.userId ?? null,
      },
    });

    revalidatePath("/dashboard/reports");
    return { success: true, data: comment };
  } catch (err: any) {
    console.error("Comment creation error:", err);
    return { success: false, error: err.message || "Failed to add comment" };
  }
}