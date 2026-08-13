// app/blog/page.tsx
import React from "react";
import { getBlogPostsByCategory } from "@/app/actions/blog-actions";
import { BlogFeed } from "./BlogFeed";

type PageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function BlogPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const currentCategoryKey = resolvedParams.category || "insights";

  const response = await getBlogPostsByCategory(currentCategoryKey);
  const posts = response.data || [];

  return (
    <BlogFeed
      initialPosts={posts}
      categoryKey={currentCategoryKey}
      categoryLabel="Field Insights & Stories"
    />
  );
}