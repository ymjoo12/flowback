export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toErrorResponse(err: unknown): { message: string; status: number } {
  if (err instanceof AppError) return { message: err.message, status: err.status };
  return { message: err instanceof Error ? err.message : String(err), status: 500 };
}
