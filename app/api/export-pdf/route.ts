import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";


import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Question from "@/lib/models/Question";
import Test from "@/lib/models/Test";
import { generatePDFTemplate } from "@/utils/questionTemplate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECTION_ALIAS: Record<string, string> = {
  reading: "Reading and Writing",
  "reading-and-writing": "Reading and Writing",
  "reading & writing": "Reading and Writing",
  math: "Math",
};

type PDFQuestion = {
  section?: string;
  module?: number;
  questionType?: "multiple_choice" | "spr";
  questionText?: string;
  passage?: string;
  choices?: string[];
  sprAnswers?: string[];
  correctAnswer?: string;
  imageUrl?: string;
  [key: string]: unknown;
};

type PDFTest = {
  title: string;
};

function normalizeSection(rawSection: string | null): string | undefined {
  if (!rawSection) {
    return undefined;
  }

  const trimmed = rawSection.trim();
  if (!trimmed) {
    return undefined;
  }

  return SECTION_ALIAS[trimmed.toLowerCase()] ?? trimmed;
}

function buildFileName(title: string, sectionName?: string): string {
  const joined = [title, sectionName, "PDF"]
    .filter(Boolean)
    .join("_")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_");

  return `${joined || "practice_test"}.pdf`;
}

export async function GET(req: NextRequest) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const testId = searchParams.get("testId");
    const sectionName = normalizeSection(searchParams.get("section"));

    if (!testId) {
      return NextResponse.json({ error: "Missing testId" }, { status: 400 });
    }

    await dbConnect();

    const [rawTest, rawQuestions] = await Promise.all([
      Test.findById(testId).select("title").lean<PDFTest | null>(),
      Question.find(sectionName ? { testId, section: sectionName } : { testId }).lean<PDFQuestion[]>(),
    ]);

    if (!rawTest?.title) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (!rawQuestions.length) {
      return NextResponse.json({ error: "No questions found for this test" }, { status: 404 });
    }

    const htmlContent = generatePDFTemplate({
      testTitle: rawTest.title,
      questions: rawQuestions,
      sectionName,
    });

   browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true, // Ép trình duyệt luôn chạy ngầm
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `
        <div style="width: 100%; padding: 0 14mm 6mm; font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #334155;">
          <div style="text-align: left; width: 100%;">Ronan SAT</div>
        </div>
      `,
      margin: {
        top: "8mm",
        right: "0",
        bottom: "16mm",
        left: "0",
      },
    });

    const responseBody = Buffer.from(pdfBuffer);

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${buildFileName(rawTest.title, sectionName)}"`,
      },
    });
  } catch (error) {
    console.error("Failed to export PDF", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
