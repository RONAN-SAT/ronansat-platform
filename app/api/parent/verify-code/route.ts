import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";

import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import ParentVerificationCode from "@/lib/models/ParentVerificationCode";
import User from "@/lib/models/User";
import { normalizeEmail } from "@/lib/security";

type VerifyCodeBody = {
  studentEmail?: string;
  code?: string;
  parentEmail?: string;
  parentPassword?: string;
};

type SessionUserWithId = {
  id?: string;
};

function isStudentLikeRole(role: string | undefined): boolean {
  return !role || role === "STUDENT" || role === "user" || role ==="admin";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as VerifyCodeBody;
    const rawStudentEmail = body.studentEmail?.trim();
    const rawCode = body.code?.trim();
    const rawParentEmail = body.parentEmail?.trim();
    const parentPassword = body.parentPassword;

    if (!rawStudentEmail || !rawCode) {
      return NextResponse.json(
        { error: "studentEmail and code are required" },
        { status: 400 }
      );
    }

    const studentEmail = normalizeEmail(rawStudentEmail);
    const code = rawCode;

    await dbConnect();

    const otpDoc = await ParentVerificationCode.findOne({ studentEmail, code });

    if (!otpDoc) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    if (otpDoc.expiresAt.getTime() <= Date.now()) {
      await ParentVerificationCode.deleteOne({ _id: otpDoc._id });
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
    }

    const student = await User.findOne({ email: studentEmail });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const studentRole = student.role as unknown as string | undefined;
    if (!isStudentLikeRole(studentRole)) {
      return NextResponse.json({ error: "This account is not a student account" }, { status: 400 });
    }

    if (studentRole !== "STUDENT") {
      student.role = "STUDENT";
      await student.save();
    }

    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as SessionUserWithId | undefined;

    if (sessionUser?.id) {
      const currentUser = await User.findById(sessionUser.id).select("+password");

      if (!currentUser) {
        return NextResponse.json({ error: "Current user not found" }, { status: 404 });
      }

      const alreadyLinked = currentUser.childrenIds.some(
        (childId) => childId.toString() === student._id.toString()
      );

      if (!alreadyLinked) {
        currentUser.childrenIds.push(student._id);
      }

      if (!currentUser.role || currentUser.role === "STUDENT") {
        currentUser.role = "PARENT";
      }

      await currentUser.save();
    } else {
      if (!rawParentEmail || !parentPassword) {
        return NextResponse.json(
          { error: "parentEmail and parentPassword are required" },
          { status: 400 }
        );
      }

      const parentEmail = normalizeEmail(rawParentEmail);

      const existingParent = await User.findOne({ email: parentEmail });
      if (existingParent) {
        return NextResponse.json({ error: "Parent email already exists" }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(parentPassword, 10);

      await User.create({
        email: parentEmail,
        password: hashedPassword,
        role: "PARENT",
        childrenIds: [student._id],
      });
    }

    await ParentVerificationCode.deleteOne({ _id: otpDoc._id });

    return NextResponse.json(
      { message: "Parent verification completed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/parent/verify-code error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
