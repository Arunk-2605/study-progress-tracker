import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seeding...");

  // Create sample users
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  const mentor = await prisma.user.upsert({
    where: { email: "mentor@example.com" },
    update: {},
    create: {
      name: "Sample Mentor",
      email: "mentor@example.com",
      password: hashedPassword,
      role: "MENTOR",
    },
  });

  const learner = await prisma.user.upsert({
    where: { email: "learner@example.com" },
    update: {},
    create: {
      name: "Sample Learner",
      email: "learner@example.com",
      password: hashedPassword,
      role: "LEARNER",
    },
  });

  // Define three goals and their topics
  const goals = [
    {
      title: "Web Development",
      description: "Learn full-stack web development",
      topics: [
        "HTML Basics",
        "CSS Basics",
        "JavaScript",
        "TypeScript",
      ],
    },
    {
      title: "Database Management",
      description: "Learn database design and management",
      topics: [
        "Database Fundamentals",
        "SQL Basics",
        "PostgreSQL",
        "Database Relationships",
      ],
    },
    {
      title: "Backend Development",
      description: "Learn backend application development",
      topics: [
        "Node.js",
        "NestJS",
        "REST APIs",
        "Authentication",
      ],
    },
  ];

  const createdTopics: { id: number; title: string }[][] = [];

  for (const goalData of goals) {
    const goal = await prisma.goal.create({
      data: {
        title: goalData.title,
        description: goalData.description,
        userId: learner.id,
      },
    });

    const topicsForGoal = [];

    for (const topicTitle of goalData.topics) {
      const topic = await prisma.topic.create({
        data: {
          title: topicTitle,
          goalId: goal.id,
        },
      });

      topicsForGoal.push(topic);
    }

    createdTopics.push(topicsForGoal);
  }

  // Create prerequisite relationships
  for (const topics of createdTopics) {
    for (let i = 1; i < topics.length; i++) {
      await prisma.topicPrerequisite.create({
        data: {
          topicId: topics[i].id,
          prerequisiteId: topics[i - 1].id,
        },
      });
    }
  }

  // Create 30 study sessions spread across six weeks
  const allTopics = createdTopics.flat();

  for (let i = 0; i < 30; i++) {
    const topic = allTopics[i % allTopics.length];

    const date = new Date();
    date.setDate(date.getDate() - Math.floor((i * 42) / 30) - 1);
    date.setHours(10, 0, 0, 0);

    await prisma.studySession.create({
      data: {
        date,
        minutes: 30 + (i % 5) * 15,
        note: `Sample study session ${i + 1}`,
        userId: learner.id,
        topicId: topic.id,
      },
    });
  }

  // Create application configuration
  await prisma.appConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      minSessionMinutes: 5,
      maxSessionMinutes: 480,
      maxPrerequisites: 5,
    },
  });

  console.log("Database seeding completed!");
  console.log("Mentor:", mentor.email);
  console.log("Learner:", learner.email);
  console.log("Created 3 goals, 12 topics and 30 study sessions.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });