import { saveTemplate } from "@/lib/admin-template";
import { apiError } from "@/lib/http";
export async function POST(request: Request) {
  try {
    return await saveTemplate(request);
  } catch (error) {
    return apiError(error);
  }
}
