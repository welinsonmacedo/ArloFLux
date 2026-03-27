// core/hooks/useFormValidation.ts
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, LoginFormData, RegisterFormData } from '../validation/auth.schema';

interface UseAuthFormProps {
  isRegistering: boolean;
  defaultValues?: {
    email?: string;
    password?: string;
  };
}

export const useAuthForm = ({ isRegistering, defaultValues }: UseAuthFormProps) => {
  const schema = isRegistering ? registerSchema : loginSchema;
  
  const form = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: defaultValues?.email || '',
      password: defaultValues?.password || '',
      ...(isRegistering && { confirmPassword: '' }),
    },
    mode: 'onChange',
  });

  const getFieldError = (fieldName: string): string | undefined => {
    const error = form.formState.errors[fieldName as keyof typeof form.formState.errors];
    return error?.message as string | undefined;
  };

  return {
    ...form,
    getFieldError,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
  };
};