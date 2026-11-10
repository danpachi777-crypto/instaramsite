import { saveTemplate } from "@/lib/admin-template";
import { apiError } from "@/lib/http";
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    return await saveTemplate(request, (await context.params).id);
  } catch (error) {
    return apiError(error);
  }
}
