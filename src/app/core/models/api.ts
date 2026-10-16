export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  message?: string;
  error?: {
    message?: string;
  };
}

export interface PaginationCursor {
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface PaginationOffset {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

export const extractErrorMessage = (body?: unknown): string => {
  if (typeof body === 'string' && body.trim()) {
    return body.trim();
  }

  if (!body || typeof body !== 'object') {
    return 'Unexpected error. Please try again later.';
  }

  const candidate = body as {
    success?: boolean;
    message?: unknown;
    error?: unknown;
  };

  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    return candidate.message.trim();
  }

  if (typeof candidate.error === 'string' && candidate.error.trim()) {
    return candidate.error.trim();
  }

  if (candidate.error && typeof candidate.error === 'object') {
    const nested = (candidate.error as { message?: unknown }).message;
    if (typeof nested === 'string' && nested.trim()) {
      return nested.trim();
    }
  }

  return 'Unexpected error. Please try again later.';
};
