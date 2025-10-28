import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to IntraIIIT API" });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString() 
  });
});

app.get("/api/topics", (req, res) => {
  const text = "The hummingbird, a tiny jewel of iridescent green and blue, hovered by the fuchsia blossom. Its wings were a frantic blur, a miniature engine powered by nectar, defying gravity for a moment."
  
  res.json({
    data: text,
  });
});


app.listen(PORT, () => {
  console.log(`⚡️ Server is running on http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("Prisma disconnected");
  process.exit(0);
});