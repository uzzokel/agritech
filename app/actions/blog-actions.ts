"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Fetch all published blog posts
 */
export async function getAllBlogPosts() {
  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*, comments:blog_comments(count)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Error fetching blog posts:", error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Fetch blog posts filtered by category
 */
export async function getBlogPostsByCategory(categoryKey: string, limit?: number) {
  try {
    let query = supabase
      .from("blog_posts")
      .select("*, comments:blog_comments(count)")
      .eq("category_key", categoryKey)
      .order("created_at", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error(`Error fetching posts for category ${categoryKey}:`, error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Fetch a single blog post by its slug
 */
export async function getBlogPostBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*, comments:blog_comments(*)")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error(`Error fetching post with slug ${slug}:`, error);
    return { success: false, error: error.message, data: null };
  }
}

export async function saveBlogPost(formDataPayload: FormData) {
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

    // Generate slug from title if creating a new post or missing slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Upload image to Supabase Storage bucket 'blog-images' if a file was selected
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

      // Get Public URL for uploaded image
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
      author_name: authorName,
      author_role: authorRole,
      location,
      tag,
      category_key: categoryKey,
      image_url: imageUrl,
    };

    if (id) {
      const { error } = await supabase
        .from("blog_posts")
        .update(postData)
        .eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("blog_posts").insert([postData]);
      if (error) throw error;
    }

    revalidatePath("/blog");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving blog post:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBlogPost(id: string) {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (!error) revalidatePath("/blog");
  return { success: !error };
}

export async function likeBlogPost(id: string) {
  const { data: post } = await supabase
    .from("blog_posts")
    .select("likes")
    .eq("id", id)
    .single();

  if (post) {
    await supabase
      .from("blog_posts")
      .update({ likes: (post.likes || 0) + 1 })
      .eq("id", id);
  }
}

export async function addComment(postId: string, author: string, content: string) {
  const { data, error } = await supabase
    .from("blog_comments")
    .insert([{ post_id: postId, author, content }])
    .select()
    .single();

  if (error) return { success: false };

  return {
    success: true,
    comment: {
      id: data.id,
      author: data.author,
      content: data.content,
      createdAt: new Date(data.created_at),
    },
  };
}