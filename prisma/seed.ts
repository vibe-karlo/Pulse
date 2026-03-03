import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed categories
  const categories = [
    { name: "Company News", color: "#3B82F6" },
    { name: "HR & People", color: "#10B981" },
    { name: "Product Updates", color: "#8B5CF6" },
    { name: "Engineering", color: "#F59E0B" },
    { name: "Events", color: "#EF4444" },
    { name: "Learning & Development", color: "#06B6D4" },
    { name: "Benefits", color: "#EC4899" },
    { name: "Culture", color: "#84CC16" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // Seed admin user
  const hashedPassword = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@pulse.company" },
    update: {},
    create: {
      email: "admin@pulse.company",
      name: "Super Admin",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      department: "IT",
      seniority: "director",
      country: "US",
      region: "North America",
    },
  });

  // Seed demo user
  const userPassword = await bcrypt.hash("User123!", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "john@pulse.company" },
    update: {},
    create: {
      email: "john@pulse.company",
      name: "John Smith",
      password: userPassword,
      role: "USER",
      status: "ACTIVE",
      department: "Engineering",
      seniority: "senior",
      country: "US",
      region: "North America",
    },
  });

  // Seed a sample post
  const companyNews = await prisma.category.findFirst({
    where: { name: "Company News" },
  });

  if (companyNews) {
    const existingPost = await prisma.post.findFirst({
      where: { title: "Welcome to Pulse!" },
    });

    if (!existingPost) {
      const post = await prisma.post.create({
        data: {
          title: "Welcome to Pulse!",
          content:
            "We're excited to launch **Pulse**, your new company communication hub. Stay connected, stay informed, and collaborate with your colleagues like never before.\n\nHere you'll find:\n- Company news and announcements\n- Department updates\n- Events and learning opportunities\n- And much more!\n\nWelcome aboard! 🎉",
          authorId: admin.id,
          status: "PUBLISHED",
          publishedAt: new Date(),
          pinned: true,
          pinnedAt: new Date(),
          categories: {
            create: { categoryId: companyNews.id },
          },
          segments: {
            create: { type: "ALL", value: "all" },
          },
        },
      });

      // Create notifications for demo user
      await prisma.notification.create({
        data: {
          userId: demoUser.id,
          type: "NEW_POST",
          title: "New post: Welcome to Pulse!",
          message: "Super Admin published a new post in Company News",
          postId: post.id,
        },
      });
    }
  }

  console.log("✅ Seed completed");
  console.log("Admin: admin@pulse.company / Admin123!");
  console.log("User:  john@pulse.company / User123!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
