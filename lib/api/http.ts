import { NextResponse } from "next/server";

export interface ApiErrorBody {
  code: string;
  message: string;
  retryable: boolean;
}

export function json<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export function apiError(status: number, code: string, message: string, retryable = false) {
  const body: ApiErrorBody = { code, message, retryable };
  return NextResponse.json(body, { status });
}

export async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
