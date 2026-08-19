// app/blog/page.tsx
import React from "react";
import { getAllBlogPosts, getBlogPostsByCategory } from "@/app/actions/blog-actions";
import { getAdvisoryData } from "@/app/actions/advisory-actions";
import { BlogFeed } from "./BlogFeed";
import AdvisoriesFeed from "./AdvisoriesFeed";
import { PolicyFeed } from "./PolicyFeed";
import { TechUpdatesFeed } from "./TechUpdatesFeed";
import { MarketFeed } from "./MarketFeed"; // 👈 Import your new MarketFeed component

// Force Next.js to bypass static cache and fetch live database data every time
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function BlogPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const currentCategoryKey = resolvedParams.category || "all";

  // 1. If Advisories & Alerts is clicked
  if (currentCategoryKey === "advisories") {
    const advisoryRes = await getAdvisoryData();
    const alerts = advisoryRes?.alerts || [];
    const queries = advisoryRes?.queries || [];

    return (
      <AdvisoriesFeed
        initialAlerts={alerts}
        initialQueries={queries}
      />
    );
  }

  // 2. If Policy Briefs is clicked
  if (currentCategoryKey === "policy") {
    return <PolicyFeed />;
  }

  // 3. If Tech Updates is clicked
  if (currentCategoryKey === "tech") {
    return <TechUpdatesFeed />;
  }

  // 4. If Marketplace is clicked (👈 NEW CONDITION)
  if (currentCategoryKey === "market") {
    return <MarketFeed />;
  }

  // 5. Existing Flow: Fetch all posts when default/all, or filter by specific category
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