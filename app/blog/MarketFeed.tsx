// app/blog/MarketFeed.tsx
"use client";

import React, { useState, useEffect, useTransition } from "react";
import { 
  getMarketProducts, 
  createMarketProduct, 
  updateMarketProduct, 
  deleteMarketProduct, 
  toggleProductLike, 
  addProductComment,
  createProductInquiry
} from "@/app/actions/market-actions";

interface ProductLike {
  id: string;
  userId: string;
}

interface ProductComment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
}

interface ProductInquiryItem {
  id: string;
  inquirerName: string;
  inquirerPhone: string;
  message: string;
  status: string;
  createdAt: Date;
}

interface MarketProductItem {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string | null;
  sellerName: string;
  location: string;
  createdAt: Date;
  likes: ProductLike[];
  comments: ProductComment[];
  inquiries: ProductInquiryItem[];
}

const CATEGORIES = ["All", "Grains", "Tubers", "Vegetables", "Livestock", "Inputs & Machinery"];
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", 
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", 
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", 
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", 
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

export function MarketFeed() {
  const [products, setProducts] = useState<MarketProductItem[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, startItem: 0, endItem: 0, totalCount: 0 });
  
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterCurrency, setFilterCurrency] = useState("All");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MarketProductItem | null>(null);
  const [activeCommentProductId, setActiveCommentProductId] = useState<string | null>(null);
  const [activeInquiryProductId, setActiveInquiryProductId] = useState<string | null>(null);
  
  // Comment inputs map: productId -> { author, content }
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: { author: string; content: string } }>({});
  
  // Inquiry inputs map: productId -> { inquirerName, inquirerPhone, message }
  const [inquiryInputs, setInquiryInputs] = useState<{ [key: string]: { inquirerName: string; inquirerPhone: string; message: string } }>({});

  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInquiring, setIsInquiring] = useState(false);

  const fetchProducts = () => {
    startTransition(async () => {
      const res = await getMarketProducts({ page, search, category: filterCategory, currency: filterCurrency });
      setProducts(res.data as MarketProductItem[]);
      setPagination(res.pagination);
    });
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search, filterCategory, filterCurrency]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      if (editingProduct) {
        formData.append("existingImageUrl", editingProduct.imageUrl || "");
        const res = await updateMarketProduct(editingProduct.id, formData);
        if (res.success) {
          setEditingProduct(null);
          setShowForm(false);
          fetchProducts();
        } else {
          alert(res.error);
        }
      } else {
        const res = await createMarketProduct(formData);
        if (res.success) {
          setShowForm(false);
          fetchProducts();
        } else {
          alert(res.error);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = async (productId: string) => {
    const input = commentInputs[productId];
    if (!input || !input.content.trim()) return;

    const res = await addProductComment(productId, input.author || "Farmer / Buyer", input.content);
    if (res.success) {
      setCommentInputs({ ...commentInputs, [productId]: { author: "", content: "" } });
      fetchProducts();
    }
  };

  const handleInquirySubmit = async (productId: string) => {
    const input = inquiryInputs[productId];
    if (!input || !input.inquirerName || !input.inquirerPhone || !input.message) {
      alert("Please fill in all required fields (Name, Phone, and your Inquiry message).");
      return;
    }

    setIsInquiring(true);
    try {
      const res = await createProductInquiry(
        productId,
        input.inquirerName,
        input.inquirerPhone,
        input.message
      );

      if (res.success) {
        alert("Inquiry sent successfully! The seller will get in touch with you.");
        setInquiryInputs({ ...inquiryInputs, [productId]: { inquirerName: "", inquirerPhone: "", message: "" } });
        setActiveInquiryProductId(null);
        fetchProducts();
      } else {
        alert(res.error || "Failed to submit inquiry.");
      }
    } finally {
      setIsInquiring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">AgriHub Produce Marketplace</h2>
          <p className="text-sm text-slate-500">Direct farm gate produce listing, pricing, and buyer inquiries.</p>
        </div>
        
        <button
          onClick={() => { setEditingProduct(null); setShowForm(!showForm); }}
          className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors shadow-sm"
        >
          {showForm ? "Cancel" : "+ Post Produce / Product"}
        </button>
      </div>

      {/* Create / Edit Form Modal */}
      {showForm && (
        <form onSubmit={handleFormSubmit} className="p-6 border rounded-xl bg-slate-50 shadow-inner space-y-4">
          <h3 className="text-base font-semibold text-slate-800">
            {editingProduct ? "Edit Product Listing" : "Post New Farm Produce"}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Product Title</label>
              <input 
                name="title"
                defaultValue={editingProduct?.title || ""}
                placeholder="e.g. Grade A Raw White Maize (Per Bag)"
                required
                className="w-full p-2 border rounded bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select
                name="category"
                defaultValue={editingProduct?.category || "Grains"}
                required
                className="w-full p-2 border rounded bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Grains">Grains</option>
                <option value="Tubers">Tubers</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Livestock">Livestock</option>
                <option value="Inputs & Machinery">Inputs & Machinery</option>
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Price</label>
                <input 
                  type="number"
                  step="any"
                  name="price"
                  defaultValue={editingProduct?.price || ""}
                  placeholder="e.g. 45000"
                  required
                  className="w-full p-2 border rounded bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="w-28">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Currency</label>
                <select
                  name="currency"
                  defaultValue={editingProduct?.currency || "NGN"}
                  className="w-full p-2 border rounded bg-white text-slate-900 text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="NGN">₦ (NGN)</option>
                  <option value="USD">$ (USD)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Location / Cluster</label>
              <select
                name="location"
                defaultValue={editingProduct?.location || ""}
                required
                className="w-full p-2 border rounded bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select State / Cluster</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Seller / Farmer Name</label>
              <input 
                name="sellerName"
                defaultValue={editingProduct?.sellerName || ""}
                placeholder="e.g. Zaria Cooperative Farmers Ltd"
                required
                className="w-full p-2 border rounded bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Produce Image</label>
              <input 
                name="image" 
                type="file" 
                accept="image/*" 
                className="p-2 border rounded bg-white text-slate-900 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description (Max 300 words)</label>
              <textarea 
                name="description"
                defaultValue={editingProduct?.description || ""}
                placeholder="Describe quality, packaging size, moisture content, delivery options..."
                rows={4}
                required
                className="w-full p-2 border rounded bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {editingProduct && (
              <button
                type="button"
                onClick={() => { setEditingProduct(null); setShowForm(false); }}
                className="px-4 py-2 border rounded-lg text-sm text-slate-600 bg-white hover:bg-slate-50 transition"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-600 text-white font-medium text-sm rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : editingProduct ? "Update Listing" : "Publish Listing"}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 border rounded-xl shadow-sm">
        <input
          type="text"
          placeholder="Search produce, descriptions, sellers..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-4 py-2 border rounded-lg w-full sm:flex-1 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <select
          value={filterCurrency}
          onChange={(e) => { setFilterCurrency(e.target.value); setPage(1); }}
          className="p-2 border rounded-lg bg-white text-slate-800 text-sm w-full sm:w-36 font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="All">All Currencies</option>
          <option value="NGN">₦ (NGN)</option>
          <option value="USD">$ (USD)</option>
        </select>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setFilterCategory(cat); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterCategory === cat 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isPending && products.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white border rounded-xl text-slate-500">
            Loading marketplace products...
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white border rounded-xl text-slate-500">
            No marketplace products found matching your filters.
          </div>
        ) : (
          products.map((item) => (
            <div key={item.id} className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col justify-between hover:border-emerald-200 transition">
              <div>
                {item.imageUrl && (
                  <div className="h-48 w-full overflow-hidden bg-slate-100">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md">
                      {item.category}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">{item.location}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                  <div className="text-lg font-extrabold text-emerald-700">
                    {item.currency === "NGN" ? "₦" : "$"} {item.price.toLocaleString()}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed bg-slate-50 p-2.5 rounded-lg border">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap justify-between items-center gap-2 text-[11px] text-slate-400 pt-1">
                    <span>Seller: <strong className="text-slate-700">{item.sellerName}</strong></span>
                    <button
                      onClick={() => setActiveInquiryProductId(activeInquiryProductId === item.id ? null : item.id)}
                      className="px-2.5 py-1 bg-emerald-700 text-white font-semibold rounded hover:bg-emerald-800 transition shadow-sm"
                    >
                      📩 Make Inquiry {item.inquiries?.length > 0 && `(${item.inquiries.length})`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Footer: Likes, Comments, Edit/Delete */}
              <div className="border-t bg-slate-50 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Like Button */}
                    <button
                      onClick={async () => {
                        await toggleProductLike(item.id);
                        fetchProducts();
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-white border px-2.5 py-1 rounded-md shadow-sm transition"
                    >
                      ❤️ {item.likes.length}
                    </button>

                    {/* Comment Toggle Button */}
                    <button
                      onClick={() => setActiveCommentProductId(activeCommentProductId === item.id ? null : item.id)}
                      className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border px-2.5 py-1 rounded-md shadow-sm transition"
                    >
                      💬 {item.comments.length}
                    </button>
                  </div>

                  {/* Edit / Delete Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingProduct(item); setShowForm(true); }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm("Are you sure you want to delete this listing?")) {
                          await deleteMarketProduct(item.id);
                          fetchProducts();
                        }
                      }}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Make Inquiry Section */}
                {activeInquiryProductId === item.id && (
                  <div className="space-y-3 pt-2 border-t bg-emerald-50/50 p-3 rounded-lg border border-emerald-200">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">📩 Send Private Inquiry</h4>
                      <button 
                        onClick={() => setActiveInquiryProductId(null)}
                        className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <div className="space-y-2">
                      <input
                        placeholder="Your Full Name *"
                        value={inquiryInputs[item.id]?.inquirerName || ""}
                        onChange={(e) => setInquiryInputs({
                          ...inquiryInputs,
                          [item.id]: { ...inquiryInputs[item.id], inquirerName: e.target.value }
                        })}
                        className="w-full p-2 text-xs border rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <input
                        placeholder="Phone Number / WhatsApp *"
                        value={inquiryInputs[item.id]?.inquirerPhone || ""}
                        onChange={(e) => setInquiryInputs({
                          ...inquiryInputs,
                          [item.id]: { ...inquiryInputs[item.id], inquirerPhone: e.target.value }
                        })}
                        className="w-full p-2 text-xs border rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <textarea
                        rows={2}
                        placeholder="Your inquiry message (e.g. Negotiating price, delivery options)... *"
                        value={inquiryInputs[item.id]?.message || ""}
                        onChange={(e) => setInquiryInputs({
                          ...inquiryInputs,
                          [item.id]: { ...inquiryInputs[item.id], message: e.target.value }
                        })}
                        className="w-full p-2 text-xs border rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => handleInquirySubmit(item.id)}
                        disabled={isInquiring}
                        className="w-full py-2 bg-emerald-700 text-white text-xs font-bold rounded shadow hover:bg-emerald-800 transition disabled:opacity-50"
                      >
                        {isInquiring ? "Sending Inquiry..." : "Submit Inquiry to Seller"}
                      </button>
                    </div>

                    {/* Existing Inquiries list preview */}
                    {item.inquiries?.length > 0 && (
                      <div className="pt-2 border-t border-emerald-200">
                        <span className="text-[11px] font-bold text-emerald-900 block mb-1">Previous Inquiries ({item.inquiries.length}):</span>
                        <div className="max-h-24 overflow-y-auto space-y-1">
                          {item.inquiries.map((iq) => (
                            <div key={iq.id} className="text-[11px] bg-white p-1.5 rounded border text-slate-700 space-y-0.5">
                              <div className="flex justify-between font-bold text-slate-800">
                                <span>{iq.inquirerName}</span>
                                <span className="text-emerald-700">{iq.status}</span>
                              </div>
                              <p className="text-slate-600 line-clamp-1">{iq.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Collapsible Comments Section */}
                {activeCommentProductId === item.id && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {item.comments.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No comments yet. Publicly discuss or ask about this product!</p>
                      ) : (
                        item.comments.map((c) => (
                          <div key={c.id} className="text-xs bg-white p-2 rounded border space-y-0.5">
                            <span className="font-bold text-slate-800 block">{c.author}</span>
                            <p className="text-slate-600">{c.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-2">
                      <input
                        placeholder="Your name or organization"
                        value={commentInputs[item.id]?.author || ""}
                        onChange={(e) => setCommentInputs({
                          ...commentInputs,
                          [item.id]: { author: e.target.value, content: commentInputs[item.id]?.content || "" }
                        })}
                        className="w-full p-1.5 text-xs border rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <div className="flex gap-1">
                        <input
                          placeholder="Leave a public comment..."
                          value={commentInputs[item.id]?.content || ""}
                          onChange={(e) => setCommentInputs({
                            ...commentInputs,
                            [item.id]: { author: commentInputs[item.id]?.author || "", content: e.target.value }
                          })}
                          className="flex-1 p-1.5 text-xs border rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          onClick={() => handleCommentSubmit(item.id)}
                          className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 transition"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white px-4 py-3 border rounded-xl shadow-sm gap-4">
        <div className="text-xs text-slate-600">
          Showing <span className="font-semibold text-slate-900">{pagination.startItem || 0}</span> to{" "}
          <span className="font-semibold text-slate-900">{pagination.endItem || 0}</span> of{" "}
          <span className="font-semibold text-slate-900">{pagination.totalCount || 0}</span> entries
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page <= 1 || isPending}
            className="px-3 py-1.5 border rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>

          <span className="text-xs font-medium text-slate-700 px-2">
            Page {pagination.currentPage || page} of {pagination.totalPages || 1}
          </span>

          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages || 1))}
            disabled={page >= (pagination.totalPages || 1) || isPending}
            className="px-3 py-1.5 border rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}