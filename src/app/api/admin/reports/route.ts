import { requireAdmin } from "@/lib/auth";
import { failure, json } from "@/lib/http";
import { getReport } from "@/lib/reports";
import { pageNumber, periodFromParams } from "@/lib/validation";
export async function GET(request: Request) {
  try {
    const { client } = await requireAdmin();
    const p = new URL(request.url).searchParams;
    return json(
      await getReport(client, periodFromParams(p), pageNumber(p.get("page"))),
    );
  } catch (error) {
    return failure(error);
  }
}
