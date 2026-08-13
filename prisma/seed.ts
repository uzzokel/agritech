import { PrismaClient, BlogCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

// 1. Create pg connection pool
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Initialize Prisma v7 Adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to PrismaClient
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seeding...");

  // Seed Default Categories for WorkPlans
  const defaultCategories = ["CIVIL_WORKS", "PERSONNEL", "CONSULTANCY", "EQUIPMENT"];
  for (const name of defaultCategories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Seed Sample Blog Post 1 (Field Insights)
  const post1 = await prisma.blogPost.upsert({
    where: { slug: "scaling-maize-yields-kano-clusters" },
    update: {},
    create: {
      title: "Scaling Maize Yields Across Kano State Clusters",
      slug: "scaling-maize-yields-kano-clusters",
      excerpt: "How 400 local farmers adopted digital cluster grouping to streamline fertilizer allocation and increase annual yields by 28%.",
      content: `
        ### Background & Context
        In late 2025, smallholder farmers across Kano State faced significant challenges in accessing timely agricultural inputs. Through regional cluster coordination, local farmer groups were unified onto a single platform to aggregate supply orders and coordinate local extension workers.

        ### Key Interventions
        * **Digital Cluster Mapping:** Direct registration of farmers into verified user groups.
        * **Input Supply Optimization:** Direct delivery of seed and fertilizer allotments based on estimated farm size.
        * **Real-time Extension Advisories:** SMS and localized agent contact for early pest prevention.

        ### Results Achieved
        Over 400 registered farmers saw an average yield improvement of **28%**, with input waste dropping to under **4%**.
      `,
      category: BlogCategory.FIELD_INSIGHTS,
      authorName: "Sani Ibrahim",
      authorRole: "Senior Extension Officer",
      location: "Kano, Nigeria",
      tag: "Case Study",
      likes: 12,
      published: true,
    },
  });

  // Seed Sample Blog Post 2 (Advisories)
  await prisma.blogPost.upsert({
    where: { slug: "q3-dry-season-irrigation-guidelines" },
    update: {},
    create: {
      title: "Q3 Dry-Season Irrigation & Soil Moisture Guidelines",
      slug: "q3-dry-season-irrigation-guidelines",
      excerpt: "Recommended moisture retention strategies and water conservation practices for high-temperature zones.",
      content: "Detailed technical advisory on moisture retention and irrigation management...",
      category: BlogCategory.ADVISORIES,
      authorName: "Dr. Amina Yusuf",
      authorRole: "Agronomy Specialist",
      location: "Kaduna, Nigeria",
      tag: "Advisory",
      likes: 8,
      published: true,
    },
  });

  // Seed a sample comment on Post 1
  await prisma.comment.create({
    data: {
      postId: post1.id,
      author: "Usman Bello",
      content: "Great insight! We are looking forward to implementing similar cluster tracking in Kaduna LGA next season.",
    },
  });

  console.log("✅ Seed data added successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });