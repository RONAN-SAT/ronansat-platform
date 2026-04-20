import { resultController } from "@/lib/controllers/resultController";

export async function POST(req: Request) {
  return resultController.createResult(req);
}

export async function GET(req: Request) {
  return resultController.getUserResults(req);
}
