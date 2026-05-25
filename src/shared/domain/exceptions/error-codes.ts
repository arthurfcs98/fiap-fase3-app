import {
  createErrorCodesWithMessages,
  createCommonErrorCodesWithMessages,
} from './error-codes.factory';

/**
 * Service prefix for Oficina Mecânica
 */
export const SERVICE_PREFIX = 'OM';

/**
 * Common error codes with OM prefix and Portuguese user messages
 */
export const COMMON_ERRORS = createCommonErrorCodesWithMessages(SERVICE_PREFIX);

/**
 * All error codes with Portuguese user messages
 *
 * Format: { code: 'OM_<ERROR_NAME>', userMessage: 'Portuguese message' }
 */
export const ERRORS = {
  // Include common errors
  ...COMMON_ERRORS,

  // Customer errors
  ...createErrorCodesWithMessages(SERVICE_PREFIX, {
    CUSTOMER_NOT_FOUND: { userMessage: 'Cliente não encontrado.' },
    CUSTOMER_ALREADY_EXISTS: {
      userMessage: 'Já existe um cliente com este documento.',
    },
    CUSTOMER_EMAIL_IN_USE: { userMessage: 'Este email já está em uso.' },
    CUSTOMER_HAS_ORDERS: {
      userMessage: 'Cliente possui ordens de serviço vinculadas.',
    },
    INVALID_CPF: { userMessage: 'CPF inválido.' },
    INVALID_CNPJ: { userMessage: 'CNPJ inválido.' },
    INVALID_DOCUMENT: { userMessage: 'Documento inválido.' },
  }),

  // Vehicle errors
  ...createErrorCodesWithMessages(SERVICE_PREFIX, {
    VEHICLE_NOT_FOUND: { userMessage: 'Veículo não encontrado.' },
    VEHICLE_PLATE_IN_USE: { userMessage: 'Já existe um veículo com esta placa.' },
    VEHICLE_NOT_OWNED_BY_CUSTOMER: {
      userMessage: 'Veículo não pertence a este cliente.',
    },
    VEHICLE_HAS_ORDERS: {
      userMessage: 'Veículo possui ordens de serviço vinculadas.',
    },
    INVALID_LICENSE_PLATE: { userMessage: 'Placa do veículo inválida.' },
  }),

  // Service errors
  ...createErrorCodesWithMessages(SERVICE_PREFIX, {
    SERVICE_NOT_FOUND: { userMessage: 'Serviço não encontrado.' },
    SERVICE_CODE_IN_USE: { userMessage: 'Já existe um serviço com este código.' },
  }),

  // Part errors
  ...createErrorCodesWithMessages(SERVICE_PREFIX, {
    PART_NOT_FOUND: { userMessage: 'Peça não encontrada.' },
    PART_CODE_IN_USE: { userMessage: 'Já existe uma peça com este código.' },
    INSUFFICIENT_STOCK: { userMessage: 'Estoque insuficiente para esta operação.' },
    INVALID_STOCK_OPERATION: { userMessage: 'Operação de estoque inválida.' },
    STOCK_RESERVATION_FAILED: { userMessage: 'Falha ao reservar estoque.' },
  }),

  // Service Order errors
  ...createErrorCodesWithMessages(SERVICE_PREFIX, {
    SERVICE_ORDER_NOT_FOUND: { userMessage: 'Ordem de serviço não encontrada.' },
    SERVICE_ORDER_ITEM_NOT_FOUND: {
      userMessage: 'Item da ordem de serviço não encontrado.',
    },
    INVALID_STATUS_TRANSITION: { userMessage: 'Transição de status inválida.' },
    CANNOT_MODIFY_ORDER_IN_STATUS: {
      userMessage: 'Não é possível modificar a ordem neste status.',
    },
    ORDER_ALREADY_APPROVED: { userMessage: 'Ordem de serviço já foi aprovada.' },
    ORDER_ALREADY_REJECTED: { userMessage: 'Ordem de serviço já foi rejeitada.' },
    ORDER_NOT_AWAITING_APPROVAL: {
      userMessage: 'Ordem de serviço não está aguardando aprovação.',
    },
  }),

  // Auth errors
  ...createErrorCodesWithMessages(SERVICE_PREFIX, {
    INVALID_CREDENTIALS: { userMessage: 'Credenciais inválidas.' },
    USER_NOT_FOUND: { userMessage: 'Usuário não encontrado.' },
    USER_ALREADY_EXISTS: { userMessage: 'Usuário já existe.' },
    INVALID_TOKEN: { userMessage: 'Token inválido ou expirado.' },
    USER_INACTIVE: { userMessage: 'Usuário inativo.' },
    INVALID_EMAIL: { userMessage: 'Email inválido.' },
  }),
} as const;

/**
 * Type for error codes
 */
export type ErrorCode = (typeof ERRORS)[keyof typeof ERRORS]['code'];
