import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/mongodb";
import ParentVerificationCode from "@/lib/models/ParentVerificationCode";
import User from "@/lib/models/User";
import { normalizeEmail } from "@/lib/security";

type RequestCodeBody = {
  studentEmail?: string;
};

function generateSixDigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isStudentLikeRole(role: string | undefined): boolean {
  return !role || role === "STUDENT" || role === "user" || role ==="admin";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as RequestCodeBody;
    const rawStudentEmail = body.studentEmail?.trim();

    if (!rawStudentEmail) {
      return NextResponse.json({ error: "studentEmail is required" }, { status: 400 });
    }

    const studentEmail = normalizeEmail(rawStudentEmail);

    await dbConnect();

    const student = await User.findOne({ email: studentEmail });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const currentRole = student.role as unknown as string | undefined;
    if (!isStudentLikeRole(currentRole)) {
      return NextResponse.json({ error: "This account is not a student account" }, { status: 400 });
    }

    if (currentRole !== "STUDENT") {
      student.role = "STUDENT";
      await student.save();
    }

    const code = generateSixDigitOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await ParentVerificationCode.findOneAndUpdate(
      { studentEmail },
      {
        studentEmail,
        code,
        expiresAt,
        attemptCount: 0,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(`[Parent OTP] ${studentEmail}: ${code}`);

    return NextResponse.json(
      { message: "Verification code generated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/parent/request-code error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
