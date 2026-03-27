// modules/auth/components/Login.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthForm } from '@/core/hooks/useFormValidation';
import { useAuthActions } from '@/core/hooks/useAuthActions';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { GlobalLoading } from '@/modules/common/components/GlobalLoading';
import { Button } from '@/modules/common/components/Button';
import { LoginFormData, RegisterFormData } from '@/core/validation/auth.schema';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export const Login: React.FC = () => {
  const { state: authState } = useAuth();
  const { state: restState } = useRestaurant();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    getFieldError,
    reset 
  } = useAuthForm({
    isRegistering,
    defaultValues: { email: '', password: '' }
  });
  
  const {
    loading,
    error,
    successMessage,
    handleLogin,
    handleRegister,
    clearMessages
  } = useAuthActions();
  
  // Parâmetros da URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    const registerParam = params.get('register');
    const confirmedParam = params.get('confirmed');
    
    if (emailParam) {
      reset({ email: emailParam });
    }
    
    if (registerParam === 'true') {
      setIsRegistering(true);
    }
    
    if (confirmedParam === 'true') {
      clearMessages();
      // Mostrar toast de confirmação
    }
  }, [location.search, reset]);
  
  // Limpar mensagens ao trocar modo
  useEffect(() => {
    clearMessages();
  }, [isRegistering]);
  
  const onSubmit = async (data: LoginFormData | RegisterFormData) => {
    if (isRegistering) {
      await handleRegister(data as RegisterFormData);
    } else {
      await handleLogin(data as LoginFormData);
    }
  };
  
  if (authState.isLoading) {
    return <GlobalLoading message="Verificando autenticação..." />;
  }
  
  const bgUrl = restState.theme?.loginBgUrl || restState.globalSettings?.loginBgUrl;
  const boxColor = restState.theme?.loginBoxColor || restState.globalSettings?.loginBoxColor;
  const restaurantName = restState.isValidTenant ? restState.theme.restaurantName : 'ArloFlux';
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{restaurantName}</h1>
          <p className="text-gray-300">
            {isRegistering ? 'Crie sua conta' : 'Acesse sua conta'}
          </p>
        </div>
        
        {/* Form Card */}
        <div 
          className="bg-white rounded-2xl shadow-xl p-8"
          style={{ backgroundColor: boxColor || '#ffffff' }}
        >
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="seu@email.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>
            
            {/* Confirm Password Field (Registration) */}
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>
            )}
            
            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading || isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>{isRegistering ? 'Criando conta...' : 'Entrando...'}</span>
                </div>
              ) : (
                <span>{isRegistering ? 'Criar Conta' : 'Entrar'}</span>
              )}
            </Button>
            
            {/* Toggle Mode */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                disabled={loading}
              >
                {isRegistering 
                  ? 'Já tem uma conta? Faça login' 
                  : 'Não tem uma conta? Cadastre-se'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};