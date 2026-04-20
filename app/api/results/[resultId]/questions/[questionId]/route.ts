import { resultController } from "@/lib/controllers/resultController";

type RouteContext = {
  params: Promise<{
    resultId: string;
    questionId: string;
  }>;
};

export async function GET(req: Request, context: RouteContext) {
  const { resultId, questionId } = await context.params;
  return resultController.getUserResultQuestion(req, resultId, questionId);
}
