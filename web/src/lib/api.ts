import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  console.error(error);
  if (error instanceof ZodError) {
    return jsonError(error.issues[0]?.message ?? "Invalid request", 400);
  }
  if (error instanceof Error && error.message === "Unauthorized") {
    return jsonError("Unauthorized", 401);
  }
  return jsonError("Internal server error", 500);
}
