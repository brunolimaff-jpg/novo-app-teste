import type { MessageId, SessionId, UserId } from '../types';

// Zod-like validation without external dependency
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export class Validator<T> {
  private validators: Array<(value: unknown) => string | null> = [];
  private transformers: Array<(value: unknown) => unknown> = [];

  string(): Validator<string> {
    this.validators.push((v) => 
      typeof v === 'string' ? null : 'Deve ser uma string'
    );
    return this as unknown as Validator<string>;
  }

  number(): Validator<number> {
    this.validators.push((v) => 
      typeof v === 'number' && !isNaN(v) ? null : 'Deve ser um número'
    );
    return this as unknown as Validator<number>;
  }

  email(): Validator<string> {
    this.validators.push((v) => {
      if (typeof v !== 'string') return 'Deve ser uma string';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(v) ? null : 'Email inválido';
    });
    return this as unknown as Validator<string>;
  }

  min(length: number): this {
    this.validators.push((v) => {
      if (typeof v === 'string' && v.length < length) {
        return `Mínimo de ${length} caracteres`;
      }
      if (Array.isArray(v) && v.length < length) {
        return `Mínimo de ${length} itens`;
      }
      return null;
    });
    return this;
  }

  max(length: number): this {
    this.validators.push((v) => {
      if (typeof v === 'string' && v.length > length) {
        return `Máximo de ${length} caracteres`;
      }
      if (Array.isArray(v) && v.length > length) {
        return `Máximo de ${length} itens`;
      }
      return null;
    });
    return this;
  }

  regex(pattern: RegExp, message?: string): this {
    this.validators.push((v) => {
      if (typeof v !== 'string') return null;
      return pattern.test(v) ? null : (message || 'Formato inválido');
    });
    return this;
  }

  uuid(): Validator<string> {
    this.validators.push((v) => {
      if (typeof v !== 'string') return 'Deve ser uma string';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(v) ? null : 'UUID inválido';
    });
    return this as unknown as Validator<string>;
  }

  optional(): Validator<T | undefined> {
    this.validators.unshift((v) => {
      if (v === undefined || v === null) return 'optional';
      return null;
    });
    return this as unknown as Validator<T | undefined>;
  }

  transform<R>(fn: (value: T) => R): Validator<R> {
    this.transformers.push(fn as (value: unknown) => unknown);
    return this as unknown as Validator<R>;
  }

  validate(value: unknown): ValidationResult<T> {
    const errors: string[] = [];

    for (const validator of this.validators) {
      const result = validator(value);
      if (result === 'optional') {
        return { success: true, data: undefined as unknown as T };
      }
      if (result) {
        errors.push(result);
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    let transformed = value as unknown;
    for (const transformer of this.transformers) {
      transformed = transformer(transformed);
    }

    return { success: true, data: transformed as T };
  }
}

// Pre-built validators
export const v = {
  string: () => new Validator<string>().string(),
  number: () => new Validator<number>().number(),
  email: () => new Validator<string>().email(),
  uuid: () => new Validator<string>().uuid(),
};

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 10000); // Max length
}

// Message validation
export function validateMessage(text: string): ValidationResult<string> {
  const sanitized = sanitizeInput(text);
  
  if (!sanitized) {
    return { success: false, errors: ['Mensagem não pode estar vazia'] };
  }
  
  if (sanitized.length > 5000) {
    return { success: false, errors: ['Mensagem muito longa (máx 5000 caracteres)'] };
  }

  return { success: true, data: sanitized };
}

// Session ID validation
export function validateSessionId(id: string): ValidationResult<SessionId> {
  return v.uuid().validate(id) as ValidationResult<SessionId>;
}

// Rate limiting por usuário
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string, 
  maxRequests: number, 
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    // Nova janela
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimits.set(key, newEntry);
    return { allowed: true, remaining: maxRequests - 1, resetAt: newEntry.resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

// Limpar entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimits.entries()) {
    if (now > entry.resetAt) {
      rateLimits.delete(key);
    }
  }
}, 60000); // A cada minuto
