// app/blog/page.tsx
import React from "react";
import { getAllBlogPosts, getBlogPostsByCategory } from "@/app/actions/blog-actions";
import { BlogFeed } from "./BlogFeed";

type PageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function BlogPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const currentCategoryKey = resolvedParams.category || "all";

  // Fetch all posts when default/all, or filter by specific category
  const response =
    currentCategoryKey === "all"
      ? await getAllBlogPosts()
      : await getBlogPostsByCategory(currentCategoryKey);

  // Safely extract posts array with guaranteed fallback
  const posts = response?.success && Array.isArray(response.data) ? response.data : [];

  return (
    <BlogFeed
      initialPosts={posts}
      categoryKey={currentCategoryKey}
      categoryLabel="Field Insights & Stories"
    />
  );
}