/**
 * Error definition with code and user-friendly message
 */
export interface ErrorDefinition {
  /** User-friendly message (shown to end users) */
  userMessage: string;
}

/**
 * Result of createErrorCodesWithMessages - includes both code and userMessage
 */
export type ErrorCodesWithMessages<T extends Record<string, ErrorDefinition>> =
  {
    [K in keyof T]: {
      code: string;
      userMessage: string;
    };
  };

/**
 * Factory for creating service-specific error codes with messages
 *
 * Usage:
 * ```typescript
 * const ERRORS = createErrorCodesWithMessages('OM', {
 *   CUSTOMER_NOT_FOUND: { userMessage: 'Cliente não encontrado.' },
 *   INSUFFICIENT_STOCK: { userMessage: 'Estoque insuficiente.' },
 * });
 *
 * // Results in:
 * // ERRORS.CUSTOMER_NOT_FOUND.code = 'OM_CUSTOMER_NOT_FOUND'
 * // ERRORS.CUSTOMER_NOT_FOUND.userMessage = 'Cliente não encontrado.'
 * ```
 */
export function createErrorCodesWithMessages<
  T extends Record<string, ErrorDefinition>,
>(servicePrefix: string, definitions: T): ErrorCodesWithMessages<T> {
  const result = {} as ErrorCodesWithMessages<T>;

  for (const key of Object.keys(definitions) as Array<keyof T>) {
    result[key] = {
      code: `${servicePrefix}_${String(key)}`,
      userMessage: definitions[key].userMessage,
    };
  }

  return result;
}

/**
 * Common error definitions shared across all modules
 */
export const COMMON_ERROR_DEFINITIONS = {
  INTERNAL_ERROR: {
    userMessage: 'Ocorreu um erro interno. Tente novamente mais tarde.',
  },
  VALIDATION_ERROR: {
    userMessage: 'Dados inválidos. Verifique as informações enviadas.',
  },
  UNAUTHORIZED: {
    userMessage: 'Acesso não autorizado. Faça login novamente.',
  },
  FORBIDDEN: {
    userMessage: 'Você não tem permissão para realizar esta ação.',
  },
  NOT_FOUND: { userMessage: 'Recurso não encontrado.' },
  CONFLICT: { userMessage: 'Conflito de dados. O recurso já existe.' },
  BAD_REQUEST: { userMessage: 'Requisição inválida. Verifique os dados enviados.' },
} as const;

export type CommonErrorCode = keyof typeof COMMON_ERROR_DEFINITIONS;

/**
 * Creates common error codes with service prefix AND user messages
 */
export function createCommonErrorCodesWithMessages(servicePrefix: string) {
  return createErrorCodesWithMessages(servicePrefix, COMMON_ERROR_DEFINITIONS);
}

/**
 * Helper to get user message from error code
 */
export function getUserMessage(
  errors: Record<string, { code: string; userMessage: string }>,
  code: string,
  fallback = 'Ocorreu um erro. Tente novamente.',
): string {
  const error = Object.values(errors).find((e) => e.code === code);
  return error?.userMessage || fallback;
}
