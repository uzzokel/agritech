"use server";

import { prisma } from "@/lib/prisma";
import { BlogCategory } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Initialized solely for handling image uploads to Supabase Storage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Shared action result interface to fix TypeScript property access errors (e.g. `res.error`)
 */
export type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Normalizes raw category keys (e.g., "insights", "field-insights")
 * to match valid Prisma BlogCategory Enum values.
 */
function formatCategoryEnum(categoryKey: string): BlogCategory {
  if (!categoryKey) return BlogCategory.FIELD_INSIGHTS;

  const normalized = categoryKey.trim().toUpperCase().replace(/-/g, "_");

  // Lookup table for UI keys, slugs, and legacy values
  const categoryMap: Record<string, BlogCategory> = {
    // Current Active Menu Items
    FIELD_INSIGHTS: BlogCategory.FIELD_INSIGHTS,
    ADVISORIES: BlogCategory.ADVISORIES,
    POLICY_BRIEFS: BlogCategory.POLICY_BRIEFS,
    TECH_UPDATES: BlogCategory.TECH_UPDATES,
    MARKET_INSIGHTS: BlogCategory.MARKET_INSIGHTS,

    // Slugs / UI Shortcuts
    INSIGHTS: BlogCategory.FIELD_INSIGHTS,
    POLICY: BlogCategory.POLICY_BRIEFS,
    TECH: BlogCategory.TECH_UPDATES,
    MARKET: BlogCategory.MARKET_INSIGHTS,
  };

  return categoryMap[normalized] || BlogCategory.FIELD_INSIGHTS;
}

/**
 * Fetch all published blog posts
 */
export async function getAllBlogPosts(): Promise<ActionResult<any[]>> {
  try {
    const data = await prisma.blogPost.findMany({
      include: {
        _count: {
          select: { comments: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Error fetching blog posts:", error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Fetch blog posts filtered by category
 */
export async function getBlogPostsByCategory(
  categoryKey: string,
  limit?: number
): Promise<ActionResult<any[]>> {
  try {
    const data = await prisma.blogPost.findMany({
      where: {
        category: formatCategoryEnum(categoryKey),
      },
      take: limit || undefined,
      include: {
        _count: {
          select: { comments: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data };
  } catch (error: any) {
    console.error(`Error fetching posts for category ${categoryKey}:`, error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Fetch a single blog post by its slug
 */
export async function getBlogPostBySlug(slug: string): Promise<ActionResult<any>> {
  try {
    const data = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        comments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return { success: true, data };
  } catch (error: any) {
    console.error(`Error fetching post with slug ${slug}:`, error);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Save or update a blog post
 */
export async function saveBlogPost(formDataPayload: FormData): Promise<ActionResult> {
  try {
    const id = formDataPayload.get("id") as string | null;
    const title = formDataPayload.get("title") as string;
    const excerpt = formDataPayload.get("excerpt") as string;
    const content = formDataPayload.get("content") as string;
    const authorName = formDataPayload.get("authorName") as string;
    const authorRole = formDataPayload.get("authorRole") as string;
    const location = formDataPayload.get("location") as string;
    const tag = formDataPayload.get("tag") as string;
    const categoryKey = formDataPayload.get("categoryKey") as string;
    let imageUrl = formDataPayload.get("existingImageUrl") as string;

    const file = formDataPayload.get("image") as File | null;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Upload image to Supabase Storage bucket 'blog-images' if a new file was provided
    if (file && file.size > 0) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) {
        console.error("Image upload failed:", uploadError);
        return { success: false, error: "Image upload failed." };
      }

      // Get public URL for uploaded image
      const { data: publicUrlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    const postData = {
      title,
      slug,
      excerpt,
      content,
      authorName,
      authorRole,
      location,
      tag,
      category: formatCategoryEnum(categoryKey),
      imageUrl,
    };

    if (id) {
      await prisma.blogPost.update({
        where: { id },
        data: postData,
      });
    } else {
      await prisma.blogPost.create({
        data: postData,
      });
    }

    revalidatePath("/blog");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving blog post:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(id: string): Promise<ActionResult> {
  try {
    await prisma.blogPost.delete({
      where: { id },
    });
    revalidatePath("/blog");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting post:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete post",
    };
  }
}

/**
 * Increment post likes
 */
export async function likeBlogPost(id: string): Promise<ActionResult> {
  try {
    await prisma.blogPost.update({
      where: { id },
      data: {
        likes: { increment: 1 },
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error liking post:", error);
    return { success: false, error: error?.message || "Failed to like post" };
  }
}

/**
 * Add a comment to a blog post
 */
export async function addComment(
  postId: string,
  author: string,
  content: string
): Promise<ActionResult<any>> {
  try {
    const newComment = await prisma.comment.create({
      data: {
        postId,
        author,
        content,
      },
    });

    return {
      success: true,
      data: {
        id: newComment.id,
        author: newComment.author,
        content: newComment.content,
        createdAt: newComment.createdAt,
      },
    };
  } catch (error: any) {
    console.error("Error adding comment:", error);
    return { success: false, error: error?.message || "Failed to add comment" };
  }
}