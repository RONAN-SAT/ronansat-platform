import { resultController } from "@/lib/controllers/resultController";

type RouteContext = {
  params: Promise<{
    resultId: string;
  }>;
};

export async function GET(req: Request, context: RouteContext) {
  const { resultId } = await context.params;
  return resultController.getUserResult(req, resultId);
}
