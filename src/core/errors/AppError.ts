// core/errors/AppError.ts
import { ErrorCode, ErrorDetails } from './errorTypes';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: ErrorDetails;
  public readonly status?: number;
  public readonly userMessage: string;

  constructor(
    code: ErrorCode,
    message: string,
    details?: ErrorDetails,
    status?: number
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.status = status;
    this.userMessage = this.getUserMessage();
  }

  private getUserMessage(): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Email ou senha incorretos. Verifique suas credenciais.',
      [ErrorCode.AUTH_EMAIL_NOT_CONFIRMED]: 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.',
      [ErrorCode.AUTH_USER_NOT_FOUND]: 'Usuário não encontrado. Verifique se o email está correto.',
      [ErrorCode.AUTH_RATE_LIMIT_EXCEEDED]: 'Muitas tentativas de login. Aguarde 15 minutos antes de tentar novamente.',
      [ErrorCode.AUTH_TENANT_MISMATCH]: 'Você não tem permissão para acessar este restaurante.',
      [ErrorCode.AUTH_STAFF_NOT_FOUND]: 'Funcionário não encontrado ou sem vínculo com restaurante.',
      [ErrorCode.AUTH_SESSION_EXPIRED]: 'Sua sessão expirou. Por favor, faça login novamente.',
      [ErrorCode.VALIDATION_REQUIRED_FIELD]: 'Este campo é obrigatório.',
      [ErrorCode.VALIDATION_INVALID_EMAIL]: 'Por favor, insira um email válido.',
      [ErrorCode.VALIDATION_PASSWORD_MISMATCH]: 'As senhas não coincidem.',
      [ErrorCode.VALIDATION_WEAK_PASSWORD]: 'A senha deve ter no mínimo 6 caracteres.',
      [ErrorCode.NETWORK_CONNECTION_ERROR]: 'Erro de conexão. Verifique sua internet.',
      [ErrorCode.NETWORK_TIMEOUT]: 'Tempo limite excedido. Tente novamente.',
      [ErrorCode.DB_CONFLICT]: 'Dados conflitantes. Por favor, tente novamente.',
      [ErrorCode.DB_NOT_FOUND]: 'Dados não encontrados.',
      [ErrorCode.UNKNOWN_ERROR]: 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
    };

    return messages[this.code] || messages[ErrorCode.UNKNOWN_ERROR];
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      details: this.details,
      status: this.status,
      timestamp: new Date().toISOString(),
    };
  }
}