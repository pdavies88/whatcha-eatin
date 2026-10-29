export type AnalysisErrorKind = 'auth' | 'rate_limit' | 'bad_request' | 'provider' | 'network' | 'parse';

export class AnalysisError extends Error {
  constructor(
    readonly kind: AnalysisErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

/** Pulls a human-readable message out of the varied error shapes providers return. */
export function providerErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const error = (body as { error?: unknown }).error;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  if ('message' in body && typeof body.message === 'string') return body.message;
  return undefined;
}

/** Gemini answers a bad key with 400 rather than 401, so the message is the only reliable signal. */
const INVALID_KEY_MESSAGE = /api key (is )?(not valid|invalid)|invalid api key/i;

export function errorForStatus(status: number, providerName: string, detail?: string): AnalysisError {
  const suffix = detail ? `\n\n${detail}` : '';
  const badKey = status === 400 && detail !== undefined && INVALID_KEY_MESSAGE.test(detail);
  if (status === 401 || status === 403 || badKey) {
    return new AnalysisError('auth', `${providerName} rejected the API key. Check it in Settings.${suffix}`, status);
  }
  if (status === 429) {
    return new AnalysisError(
      'rate_limit',
      `${providerName} is rate limiting requests or the account is out of credit. Try again shortly.${suffix}`,
      status,
    );
  }
  if (status === 400 || status === 404 || status === 422) {
    return new AnalysisError(
      'bad_request',
      `${providerName} could not handle the request. The selected model may not exist or may not support this kind of request.${suffix}`,
      status,
    );
  }
  return new AnalysisError('provider', `${providerName} returned an error (${status}).${suffix}`, status);
}
