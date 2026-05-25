export interface AppErrorPayload {
  message: string;
  code: string;
  description: string;
  metadata: Record<string, unknown>;
}

export class AppError {
  public readonly message: string;
  public readonly code: string;
  public readonly description: string;
  public readonly metadata: Record<string, unknown>;
  public readonly httpStatus: number;

  constructor(
    httpStatus: number,
    message: string,
    code: string,
    description: string,
    metadata: Record<string, unknown> = {},
  ) {
    this.httpStatus = httpStatus;
    this.message = message;
    this.code = code;
    this.description = description;
    this.metadata = metadata;
  }

  toPayload(): AppErrorPayload {
    return {
      message: this.message,
      code: this.code,
      description: this.description,
      metadata: this.metadata,
    };
  }
}
