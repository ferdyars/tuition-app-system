import { successResponse } from "@/lib/api-response";

export async function POST() {
  const response = successResponse({ message: "Logout berhasil" });

  response.headers.set(
    "Set-Cookie",
    "student-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
  );

  return response;
}
