import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return apiError(err.issues[0]?.message || "Invalid request", 422, err.flatten());
  }
  if (err instanceof Error) {
    return apiError(err.message || "Something went wrong", 500);
  }
  return apiError("Something went wrong", 500);
}
