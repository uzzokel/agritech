// app/actions/market-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FetchMarketParams {
  page?: number;
  search?: string;
  category?: string;
  currency?: string;
}

// 1. Fetch Products with Pagination, Search, Filters, and Relations
export async function getMarketProducts({ page = 1, search = "", category = "All", currency = "All" }: FetchMarketParams) {
  const pageSize = 9; // 3x3 grid layout
  const skip = (page - 1) * pageSize;

  const whereClause: any = {};
  if (category !== "All") {
    whereClause.category = category;
  }
  if (currency !== "All") {
    whereClause.currency = currency;
  }
  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { sellerName: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, totalCount] = await Promise.all([
    prisma.marketProduct.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        likes: true,
        comments: {
          orderBy: { createdAt: "desc" },
        },
        orders: {
          orderBy: { createdAt: "desc" },
        },
        inquiries: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.marketProduct.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startItem = totalCount === 0 ? 0 : skip + 1;
  const endItem = Math.min(skip + pageSize, totalCount);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      startItem,
      endItem,
    },
  };
}

// 2. Create Product Listing with Supabase Image Upload
export async function createMarketProduct(formData: FormData) {
  try {
    const file = formData.get("image") as File;
    let imageUrl: string | null = null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `market-${Date.now()}-${file.name.replace(/\s/g, "_")}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("market-images")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase storage upload error:", uploadError.message);
        return { success: false, error: `Image upload failed: ${uploadError.message}` };
      }

      const { data: publicUrlData } = supabase.storage
        .from("market-images")
        .getPublicUrl(uploadData.path);

      imageUrl = publicUrlData.publicUrl;
    }

    await prisma.marketProduct.create({
      data: {
        title: formData.get("title") as string,
        category: formData.get("category") as string,
        description: formData.get("description") as string,
        price: parseFloat(formData.get("price") as string) || 0,
        currency: formData.get("currency") as string,
        location: formData.get("location") as string,
        sellerName: (formData.get("sellerName") as string) || "Farmer / Vendor",
        imageUrl,
      },
    });

    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("Failed to create product:", error);
    return { success: false, error: "Database error: Could not post product." };
  }
}

// 3. Update Product Listing
export async function updateMarketProduct(id: string, formData: FormData) {
  try {
    const file = formData.get("image") as File;
    let imageUrl = formData.get("existingImageUrl") as string;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `market-${Date.now()}-${file.name.replace(/\s/g, "_")}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("market-images")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from("market-images")
          .getPublicUrl(uploadData.path);
        imageUrl = publicUrlData.publicUrl;
      }
    }

    await prisma.marketProduct.update({
      where: { id },
      data: {
        title: formData.get("title") as string,
        category: formData.get("category") as string,
        description: formData.get("description") as string,
        price: parseFloat(formData.get("price") as string) || 0,
        currency: formData.get("currency") as string,
        location: formData.get("location") as string,
        imageUrl,
      },
    });

    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("Failed to update product:", error);
    return { success: false, error: "Database error: Could not update product." };
  }
}

// 4. Delete Product Listing
export async function deleteMarketProduct(id: string) {
  try {
    await prisma.marketProduct.delete({
      where: { id },
    });

    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, error: "Database error: Could not delete product." };
  }
}

// 5. Toggle Like on a Product
export async function toggleProductLike(productId: string, userId: string = "guest-user") {
  try {
    const existingLike = await prisma.productLike.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    if (existingLike) {
      await prisma.productLike.delete({
        where: { id: existingLike.id },
      });
    } else {
      await prisma.productLike.create({
        data: {
          productId,
          userId,
        },
      });
    }

    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return { success: false };
  }
}

// 6. Add Comment to a Product
export async function addProductComment(productId: string, author: string, content: string) {
  try {
    if (!content.trim()) return { success: false, error: "Comment cannot be empty." };

    await prisma.productComment.create({
      data: {
        productId,
        author: author.trim() || "Anonymous Buyer",
        content: content.trim(),
      },
    });

    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("Failed to add comment:", error);
    return { success: false, error: "Database error: Could not post comment." };
  }
}

// 7. Place an Order for a Product
export async function createProductOrder(
  productId: string, 
  buyerName: string, 
  buyerPhone: string, 
  quantity: number, 
  deliveryNote: string
) {
  try {
    if (!buyerName || !buyerPhone || !quantity) {
      return { success: false, error: "Please fill in all required order details." };
    }

    await prisma.productOrder.create({
      data: {
        productId,
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        quantity: Number(quantity),
        deliveryNote: deliveryNote?.trim() || "",
        status: "Pending",
      },
    });

    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("Failed to place order:", error);
    return { success: false, error: "Database error: Could not place order." };
  }
}

// 8. Create Product Inquiry
export async function createProductInquiry(
  productId: string,
  inquirerName: string,
  inquirerPhone: string,
  message: string
) {
  try {
    if (!inquirerName || !inquirerPhone || !message) {
      return { success: false, error: "Please fill in all required inquiry details." };
    }

    await prisma.productInquiry.create({
      data: {
        productId,
        inquirerName: inquirerName.trim(),
        inquirerPhone: inquirerPhone.trim(),
        message: message.trim(),
        status: "Pending",
      },
    });

    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("Failed to submit product inquiry:", error);
    return { success: false, error: "Database error: Could not submit inquiry." };
  }
}