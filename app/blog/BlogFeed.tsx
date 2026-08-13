"use client";

import React, { useState, useTransition } from "react";
import {
  saveBlogPost,
  deleteBlogPost,
  likeBlogPost,
  addComment,
} from "@/app/actions/blog-actions";
import {
  Plus,
  Heart,
  MessageSquare,
  Edit2,
  Trash2,
  MapPin,
  User,
  Tag,
  Send,
  X,
  Sparkles,
  Image as ImageIcon,
  Upload,
} from "lucide-react";

type CommentType = {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
};

export type PostType = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  authorName: string;
  authorRole: string | null;
  location: string | null;
  tag: string | null;
  imageUrl?: string | null; // 👈 Added image URL support
  likes: number;
  createdAt: Date;
  comments: CommentType[];
};

export function BlogFeed({
  initialPosts,
  categoryKey,
  categoryLabel,
}: {
  initialPosts: PostType[];
  categoryKey: string;
  categoryLabel: string;
}) {
  const [posts, setPosts] = useState<PostType[]>(initialPosts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostType | null>(null);
  const [isPending, startTransition] = useTransition();

  // Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    authorName: "",
    authorRole: "",
    location: "",
    tag: "Case Study",
    imageUrl: "",
  });

  // Comment Input state mapped per postId
  const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");

  const handleOpenForm = (post?: PostType) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        authorName: post.authorName,
        authorRole: post.authorRole || "",
        location: post.location || "",
        tag: post.tag || "Case Study",
        imageUrl: post.imageUrl || "",
      });
      setImagePreview(post.imageUrl || null);
    } else {
      setEditingPost(null);
      setFormData({
        title: "",
        excerpt: "",
        content: "",
        authorName: "",
        authorRole: "",
        location: "",
        tag: "Case Study",
        imageUrl: "",
      });
      setImagePreview(null);
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  // File Change & Preview Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // Build FormData payload to support file upload via Server Actions
      const payload = new FormData();
      if (editingPost?.id) payload.append("id", editingPost.id);
      payload.append("title", formData.title);
      payload.append("excerpt", formData.excerpt);
      payload.append("content", formData.content);
      payload.append("authorName", formData.authorName);
      payload.append("authorRole", formData.authorRole);
      payload.append("location", formData.location);
      payload.append("tag", formData.tag);
      payload.append("categoryKey", categoryKey);
      payload.append("existingImageUrl", formData.imageUrl);

      if (selectedFile) {
        payload.append("image", selectedFile);
      }

      const res = await saveBlogPost(payload);

      if (res.success) {
        setIsModalOpen(false);
        window.location.reload(); // Refresh data feed
      } else {
        alert(res.error || "Failed to save blog post");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    startTransition(async () => {
      await deleteBlogPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    });
  };

  const handleLike = async (id: string) => {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );
    await likeBlogPost(id);
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim() || !commentAuthor.trim()) return;
    const author = commentAuthor;
    const text = commentText;

    setCommentText("");

    const res = await addComment(postId, author, text);
    if (res.success && res.comment) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: [res.comment as CommentType, ...p.comments] }
            : p
        )
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Header & Post Button */}
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#16a34a]/20 text-[#16a34a] border border-[#16a34a]/30">
            Field Insights 🌾
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-3">
            {categoryLabel}
          </h1>
          <p className="mt-1 text-slate-400 text-sm max-w-xl">
            Success stories from local farmers, case studies on cluster adoption, and field agent spotlights.
          </p>
        </div>

        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#16a34a] hover:bg-[#16a34a]/90 text-white font-semibold text-sm transition-all shadow-lg shadow-[#16a34a]/20 shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>New Field Post</span>
        </button>
      </div>

      {/* Posts Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-[#16a34a]/40 transition-all flex flex-col justify-between group shadow-lg overflow-hidden"
          >
            {/* Post Image Banner (if available) */}
            {post.imageUrl && (
              <div className="w-full h-48 overflow-hidden bg-slate-950 relative">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                {/* Top Meta Bar */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                  <span className="flex items-center gap-1 font-semibold px-2.5 py-1 rounded-md bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/20">
                    <Tag size={12} />
                    {post.tag || "Insight"}
                  </span>

                  {/* Edit & Delete Controls */}
                  <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenForm(post)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Post"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Delete Post"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Title & Excerpt */}
                <h2 className="text-xl font-bold text-white group-hover:text-[#16a34a] transition-colors leading-snug mb-3">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  {post.excerpt}
                </p>
              </div>

              {/* Author Footer & Social Engagement */}
              <div className="pt-4 border-t border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-[#16a34a]" />
                    <span className="font-medium text-slate-200">
                      {post.authorName} {post.authorRole ? `(${post.authorRole})` : ""}
                    </span>
                  </div>

                  {post.location && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <MapPin size={13} />
                      <span>{post.location}</span>
                    </div>
                  )}
                </div>

                {/* Like & Comment Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                  <div className="flex items-center gap-4">
                    {/* Like Button */}
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors group/like"
                    >
                      <Heart
                        size={16}
                        className={`transition-transform group-hover/like:scale-125 ${
                          post.likes > 0 ? "fill-rose-500 text-rose-500" : ""
                        }`}
                      />
                      <span className="font-semibold">{post.likes}</span>
                    </button>

                    {/* Comment Toggle */}
                    <button
                      onClick={() =>
                        setActiveCommentBox(
                          activeCommentBox === post.id ? null : post.id
                        )
                      }
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#16a34a] transition-colors"
                    >
                      <MessageSquare size={16} />
                      <span>{post.comments.length} Comments</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Expandable Comments Section */}
                {activeCommentBox === post.id && (
                  <div className="pt-3 space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    {/* Add Comment Input */}
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Your name..."
                        value={commentAuthor}
                        onChange={(e) => setCommentAuthor(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#16a34a]"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a response... 💬"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                          className="flex-1 text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#16a34a]"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="px-3 py-2 rounded-lg bg-[#16a34a] hover:bg-[#16a34a]/90 text-white text-xs font-semibold flex items-center gap-1"
                        >
                          <Send size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Comment Thread */}
                    <div className="space-y-2 max-h-40 overflow-y-auto pt-2">
                      {post.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="text-xs bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80"
                        >
                          <span className="font-bold text-[#16a34a] block mb-0.5">
                            {comment.author}
                          </span>
                          <p className="text-slate-300">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Creation / Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 relative shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="text-[#16a34a] w-5 h-5" />
              <h2 className="text-xl font-extrabold text-white">
                {editingPost ? "Edit Field Insight" : "Publish New Field Insight"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* Image Upload Area */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Featured Image
                </label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 max-h-48 group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-slate-300 hover:text-white hover:bg-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-800 hover:border-[#16a34a]/50 rounded-xl cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-all text-slate-400">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-6 h-6 mb-2 text-[#16a34a]" />
                      <p className="text-xs text-slate-400">
                        <span className="font-semibold text-white">Click to upload image</span> or drag and drop
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, or WEBP (MAX. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scaling Maize Yields Across Kano State Clusters"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-[#16a34a] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Excerpt (Short Summary)
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="How 400 local farmers adopted digital cluster grouping to increase yields..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-[#16a34a] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sani Ibrahim"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-[#16a34a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Role / Position
                  </label>
                  <input
                    type="text"
                    placeholder="Field Extension Agent"
                    value={formData.authorRole}
                    onChange={(e) => setFormData({ ...formData, authorRole: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-[#16a34a] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Kano, Nigeria"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-[#16a34a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Tag / Badge
                  </label>
                  <input
                    type="text"
                    placeholder="Case Study"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-[#16a34a] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Full Content
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detailed findings and story writeup..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-[#16a34a] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 rounded-xl bg-[#16a34a] hover:bg-[#16a34a]/90 text-white font-bold transition-all shadow-lg shadow-[#16a34a]/20 cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Saving Post..." : editingPost ? "Update Insight" : "Publish Insight 🌾"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}