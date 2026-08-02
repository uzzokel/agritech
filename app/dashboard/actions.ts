"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { auth, currentUser } from "@clerk/nextjs/server";

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
  createdById?: string;
  fullName: string;
  age: number | string;
  gender: string;
  highestEducation: string;
  maritalStatus: string;
  householdSize?: number | string | null;
  state: string;
  lga: string;
  cluster: string;
  userGroup: string;
  nameOfChosenEnterprise: string;
  typeOfEnterprise: string;
  estimatedAnnualIncome: number | string;
  phoneNumber: string;
  photoUrl?: string | null;
}

export async function uploadFarmerPhoto(
  formData: FormData
): Promise<{ success: boolean; url?: string | null; error?: string }> {
  try {
    const file = formData.get("photo") as File;
    if (!file || file.size === 0) {
      return { success: true, url: null };
    }

    const supabase = getSupabaseClient();
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

export async function createFarmerRecord(data: CreateFarmerInput) {
  try {
    const cookieStore = await cookies();
    let agentId = data.createdById; // Explicitly supplied ID if provided

    // 1. Prioritize active Clerk Session -> Link to DB User ID
    if (!agentId) {
      const { userId: clerkUserId } = await auth();

      if (clerkUserId) {
        let dbUser = await prisma.user.findFirst({
          where: { clerkUserId },
          select: { id: true },
        });

        // Fallback: If clerkUserId is not mapped yet, match via Clerk email
        if (!dbUser) {
          const clerkUser = await currentUser();
          const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;

          if (primaryEmail) {
            dbUser = await prisma.user.findFirst({
              where: { email: primaryEmail },
              select: { id: true },
            });

            // Auto-sync clerkUserId to database user profile
            if (dbUser) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { clerkUserId },
              });
            }
          }
        }

        if (dbUser) {
          agentId = dbUser.id;
        }
      }
    }

    // 2. Lookup by PIN session cookie
    if (!agentId) {
      agentId = cookieStore.get("agri_session_id")?.value;
    }

    // 3. Lookup by uniqueAdminId session cookie
    if (!agentId) {
      const verifiedAdminId = cookieStore.get("agri_session_verified")?.value;
      if (verifiedAdminId) {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { uniqueAdminId: verifiedAdminId },
              { id: verifiedAdminId },
            ],
          },
          select: { id: true },
        });
        if (user) agentId = user.id;
      }
    }

    if (!agentId) {
      return {
        success: false,
        error: "No active user or agent profile found. Please ensure you are logged in.",
      };
    }

    // Ensure session cookie reflects current active agent database ID
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    };
    cookieStore.set("agri_session_id", agentId, cookieOptions);

    // Save farmer record with explicit foreign key relation to User (createdById)
    const newFarmer = await prisma.farmer.create({
      data: {
        fullName: data.fullName,
        age: Number(data.age) || 0,
        gender: data.gender,
        highestEducation: data.highestEducation,
        maritalStatus: data.maritalStatus,
        householdSize: data.householdSize ? Number(data.householdSize) : null,
        state: data.state,
        lga: data.lga,
        cluster: data.cluster,
        userGroup: data.userGroup,
        nameOfChosenEnterprise: data.nameOfChosenEnterprise,
        typeOfEnterprise: data.typeOfEnterprise,
        estimatedAnnualIncome: Number(data.estimatedAnnualIncome) || 0,
        phoneNumber: data.phoneNumber,
        photoUrl: data.photoUrl,
        createdById: agentId, // 👈 Explicit link to User.id UUID
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            uniqueAdminId: true,
            email: true,
            designation: true,
            lga: true,
            state: true,
          },
        },
      },
    });

    revalidatePath("/dashboard");

    return { success: true, data: newFarmer };
  } catch (error: any) {
    console.error("Error creating farmer record:", error);
    return { success: false, error: error.message || "Database insert failed" };
  }
}

export async function getFarmerRecords() {
  try {
    const records = await prisma.farmer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            uniqueAdminId: true,
            email: true,
            designation: true,
            lga: true,
            state: true,
          },
        },
      },
    });

    return { success: true, data: records };
  } catch (error: any) {
    console.error("Error fetching farmer records:", error);
    return { success: false, data: [], error: error.message || "Failed to fetch records" };
  }
}

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

    const { userId: clerkUserId } = await auth();
    if (clerkUserId && user.clerkUserId !== clerkUserId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { clerkUserId },
      });
    }

    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    };

    cookieStore.set(
      "agri_session_verified",
      user.uniqueAdminId || user.id,
      cookieOptions
    );
    cookieStore.set("agri_session_id", user.id, cookieOptions);

  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Verification error:", error);
    return {
      success: false,
      error: error.message || "Failed to verify Unique ID and PIN",
    };
  }

  redirect("/dashboard");
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: "agri_session_verified", path: "/" });
  cookieStore.delete({ name: "agri_session_id", path: "/" });
  redirect("/login-agri");
}