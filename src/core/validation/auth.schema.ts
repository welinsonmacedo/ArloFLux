// core/validation/auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Digite um email válido')
    .transform(email => email.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email é obrigatório')
      .email('Digite um email válido')
      .transform(email => email.toLowerCase().trim()),
    password: z
      .string()
      .min(1, 'Senha é obrigatória')
      .min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z
      .string()
      .min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;