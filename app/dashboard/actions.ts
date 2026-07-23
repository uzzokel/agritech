"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

/**
 * Lazy initializer for Supabase client to prevent crashes if ENV vars are missing.
 * Prioritizes SUPABASE_SERVICE_ROLE_KEY for server-side operations to bypass RLS restrictions.
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase Environment Variables (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}

export interface CreateFarmerInput {
  fullName: string;
  age: number;
  gender: string;
  highestEducation: string;
  maritalStatus: string;
  householdSize?: number | null;
  state: string;
  lga: string;
  cluster: string;
  userGroup: string;
  nameOfChosenEnterprise: string;
  typeOfEnterprise: string;
  estimatedAnnualIncome: number;
  phoneNumber: string;
  photoUrl?: string | null;
}

/**
 * 1. Action to Upload Farmer Photo to Supabase Storage Bucket
 */
export async function uploadFarmerPhoto(
  formData: FormData
): Promise<{ success: boolean; url?: string | null; error?: string }> {
  try {
    const file = formData.get("photo") as File;
    if (!file || file.size === 0) {
      return { success: true, url: null };
    }

    const supabase = getSupabaseClient();
    
    // Clean file extension and create safe filename
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const cleanFileName = `farmer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `farmer-photos/${cleanFileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("agritech-media")
      .upload(filePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data } = supabase.storage.from("agritech-media").getPublicUrl(filePath);

    return { success: true, url: data.publicUrl };
  } catch (err: any) {
    console.error("Error uploading photo:", err);
    return { success: false, error: err.message || "Failed to upload photo" };
  }
}

/**
 * 2. Server Action to Save Farmer Record into Prisma Database
 */
export async function createFarmerRecord(data: CreateFarmerInput) {
  try {
    const newFarmer = await prisma.farmer.create({
      data: {
        fullName: data.fullName,
        age: data.age,
        gender: data.gender,
        highestEducation: data.highestEducation,
        maritalStatus: data.maritalStatus,
        householdSize: data.householdSize,
        state: data.state,
        lga: data.lga,
        cluster: data.cluster,
        userGroup: data.userGroup,
        nameOfChosenEnterprise: data.nameOfChosenEnterprise,
        typeOfEnterprise: data.typeOfEnterprise,
        estimatedAnnualIncome: data.estimatedAnnualIncome,
        phoneNumber: data.phoneNumber,
        photoUrl: data.photoUrl,
      },
    });

    revalidatePath("/dashboard");

    return { success: true, data: newFarmer };
  } catch (error: any) {
    console.error("Error creating farmer record:", error);
    return { success: false, error: error.message || "Database insert failed" };
  }
}

/**
 * 3. Server Action to Fetch All Farmer Records
 */
export async function getFarmerRecords() {
  try {
    const records = await prisma.farmer.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: records };
  } catch (error: any) {
    console.error("Error fetching farmer records:", error);
    return { success: false, error: error.message || "Failed to fetch records" };
  }
}

/**
 * 4. Server Action to Verify User Unique Admin ID & Security PIN
 */
export async function verifyFarmerUniqueId(uniqueId: string, pin: string) {
  try {
    const trimmedId = uniqueId ? uniqueId.trim() : "";
    const trimmedPin = pin ? pin.trim() : "";

    if (!trimmedId) {
      return { success: false, error: "Please enter your Unique ID." };
    }

    if (!trimmedPin || trimmedPin.length < 4 || trimmedPin.length > 6) {
      return {
        success: false,
        error: "PIN must be between 4 and 6 digits.",
      };
    }

    const user = await prisma.user.findFirst({
      where: {
        uniqueAdminId: trimmedId,
        securityPin: trimmedPin,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Invalid Unique ID or PIN. Please check your credentials.",
      };
    }

    if (user.status !== "APPROVED") {
      return {
        success: false,
        error: "Your account is currently pending approval. Please contact an admin.",
      };
    }

    const cookieStore = await cookies();
    cookieStore.set("agri_session_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 Days
    });

    return { success: true };
  } catch (error: any) {
    console.error("Verification error:", error);
    return {
      success: false,
      error: error.message || "Failed to verify Unique ID and PIN",
    };
  }
}

/**
 * 5. Server Action to Log Out User and Clear Cookie
 */
export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("agri_session_id");
  redirect("/");
}