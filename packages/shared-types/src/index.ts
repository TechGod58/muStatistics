export type ApiEnvelope<T> = {
  ok: true;
  data: T;
};

export type ApiErrorEnvelope = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export function ok<T>(data: T): ApiEnvelope<T> {
  return { ok: true, data };
}

export function fail(code: string, message: string): ApiErrorEnvelope {
  return {
    ok: false,
    error: { code, message }
  };
}
