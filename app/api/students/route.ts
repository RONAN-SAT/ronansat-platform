import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { z } from "zod";

import dbConnect from "@/lib/mongodb";
import Student from "@/lib/models/studentCard";

const studentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  school: z.string().trim().min(2).max(150),
  score: z.number().int().min(400).max(1600),
  examDate: z.string().trim().min(4).max(50),
  imageUrl: z.string().trim().url(),
});

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "8", 10)));
    const skip = (page - 1) * limit;

    const students = await Student.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Student.countDocuments();

    return NextResponse.json({ students, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (error) {
    console.error("GET /api/students error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = studentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid student payload" }, { status: 400 });
    }

    await dbConnect();

    const newStudent = await Student.create(parsed.data);
    return NextResponse.json({ message: "Student created successfully", student: newStudent }, { status: 201 });
  } catch (error) {
    console.error("POST /api/students error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
