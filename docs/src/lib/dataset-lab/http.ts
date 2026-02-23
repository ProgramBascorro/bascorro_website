import { sanitizeSegment } from './paths';

export function getParam(
  params: { [key: string]: string | string[] | undefined },
  key: string,
): string {
  const value = params[key];
  if (!value || Array.isArray(value)) {
    throw new Error(`Missing route param: ${key}`);
  }
  return sanitizeSegment(value, key);
}

export function asErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected error';
}
