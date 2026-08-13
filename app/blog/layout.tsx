import React from "react";
import { BlogNavLinks } from "./BlogNavLinks";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100 py-30">
      {/* Blog Sidebar */}
      <aside className="w-full lg:w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col shrink-0">
        <div className="mb-6 px-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Knowledge Base
          </h2>
          <p className="text-xl font-extrabold text-white mt-1">Blog Portal</p>
        </div>

        <BlogNavLinks />
      </aside>

      {/* Blog Main Content Window */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl">
        {children}
      </main>
    </div>
  );
}