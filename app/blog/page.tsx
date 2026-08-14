// app/blog/page.tsx
import React from "react";
import { getAllBlogPosts, getBlogPostsByCategory } from "@/app/actions/blog-actions";
import { getAdvisoryData } from "@/app/actions/advisory-actions";
import { BlogFeed } from "./BlogFeed";
import AdvisoriesFeed from "./AdvisoriesFeed";

// Force Next.js to bypass static cache and fetch live database data every time
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function BlogPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const currentCategoryKey = resolvedParams.category || "all";

  // 1. If Advisories & Alerts is clicked from the sidebar
  if (currentCategoryKey === "advisories") {
    const advisoryRes = await getAdvisoryData();
    // Correctly extract alerts and queries from the root object returned by getAdvisoryData()
    const alerts = advisoryRes?.alerts || [];
    const queries = advisoryRes?.queries || [];

    return (
      <AdvisoriesFeed
        initialAlerts={alerts}
        initialQueries={queries}
      />
    );
  }

  // 2. Existing Flow: Fetch all posts when default/all, or filter by specific category
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