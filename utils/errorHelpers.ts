import type { AppError, ErrorCode, ErrorSource } from '../types';

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  NETWORK: 'Problema de conexão. Verifique sua internet.',
  TIMEOUT: 'A operação demorou muito. Tente novamente.',
  RATE_LIMIT: 'Muitas requisições. Aguarde um momento.',
  MODEL_OVERLOADED: 'O modelo está sobrecarregado. Tente em alguns segundos.',
  AUTH: 'Erro de autenticação. Faça login novamente.',
  BAD_REQUEST: 'Requisição inválida. Verifique os dados.',
  SERVER: 'Erro no servidor. Tente novamente mais tarde.',
  PARSER: 'Erro ao processar resposta. Tente novamente.',
  UNKNOWN: 'Erro inesperado. Tente novamente.',
  ABORTED: 'Operação cancelada.',
  BLOCKED_CONTENT: 'Conteúdo bloqueado por segurança.',
  GUARD: 'Mensagem bloqueada por segurança. Reformule e tente novamente.',
};

export function normalizeAppError(error: unknown, source: ErrorSource = 'UNKNOWN'): AppError {
  if (error && typeof error === 'object' && 'code' in error) {
    const err = error as Partial<AppError>;
    return {
      code: err.code || 'UNKNOWN',
      message: err.message || 'Erro desconhecido',
      friendlyMessage: err.friendlyMessage || ERROR_MESSAGES[err.code || 'UNKNOWN'],
      httpStatus: err.httpStatus,
      retryable: err.retryable ?? isRetryable(err.code || 'UNKNOWN'),
      transient: err.transient ?? isTransient(err.code || 'UNKNOWN'),
      source: err.source || source,
      details: err.details,
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  const code = detectErrorCode(message);

  return {
    code,
    message,
    friendlyMessage: ERROR_MESSAGES[code],
    retryable: isRetryable(code),
    transient: isTransient(code),
    source,
  };
}

function detectErrorCode(message: string): ErrorCode {
  const lower = message.toLowerCase();
  
  if (lower.includes('timeout') || lower.includes('etimedout')) return 'TIMEOUT';
  if (lower.includes('network') || lower.includes('enetunreach') || lower.includes('econnrefused')) return 'NETWORK';
  if (lower.includes('rate limit') || lower.includes('too many requests')) return 'RATE_LIMIT';
  if (lower.includes('overloaded') || lower.includes('busy')) return 'MODEL_OVERLOADED';
  if (lower.includes('auth') || lower.includes('unauthorized') || lower.includes('forbidden')) return 'AUTH';
  if (lower.includes('bad request') || lower.includes('invalid')) return 'BAD_REQUEST';
  if (lower.includes('server error') || lower.includes('500') || lower.includes('502') || lower.includes('503')) return 'SERVER';
  if (lower.includes('abort') || lower.includes('cancelled')) return 'ABORTED';
  if (lower.includes('blocked') || lower.includes('guard')) return 'GUARD';
  
  return 'UNKNOWN';
}

function isRetryable(code: ErrorCode): boolean {
  return ['NETWORK', 'TIMEOUT', 'RATE_LIMIT', 'MODEL_OVERLOADED', 'SERVER'].includes(code);
}

function isTransient(code: ErrorCode): boolean {
  return ['RATE_LIMIT', 'MODEL_OVERLOADED'].includes(code);
}

export function createErrorBoundary<T extends Record<string, unknown>>(
  componentName: string,
  onError?: (error: AppError, info: T) => void
) {
  return {
    handleError(error: unknown, info: T): AppError {
      const appError = normalizeAppError(error, 'UI');
      console.error(`[${componentName}] Error:`, appError, info);
      onError?.(appError, info);
      return appError;
    },
  };
}
