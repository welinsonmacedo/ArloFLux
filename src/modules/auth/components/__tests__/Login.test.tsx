// src/modules/auth/components/__tests__/Login.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../Login';
import { AuthProvider } from '@/core/context/AuthProvider';
import { RestaurantProvider } from '@/core/context/RestaurantContext';

// Mock dos hooks
vi.mock('@/core/hooks/useAuthActions', () => ({
  useAuthActions: () => ({
    loading: false,
    error: null,
    successMessage: null,
    handleLogin: vi.fn(),
    handleRegister: vi.fn(),
    clearMessages: vi.fn(),
  }),
}));

vi.mock('@/core/hooks/useFormValidation', () => ({
  useAuthForm: () => ({
    register: vi.fn(),
    handleSubmit: (fn: any) => fn,
    formState: { errors: {}, isSubmitting: false },
    getFieldError: vi.fn(),
    reset: vi.fn(),
  }),
}));

describe('Login Component', () => {
  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <RestaurantProvider>
            <Login />
          </RestaurantProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should render login form', () => {
    renderLogin();
    
    expect(screen.getByPlaceholderText(/seu@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('should toggle between login and register modes', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const toggleButton = screen.getByText(/cadastre-se/i);
    await user.click(toggleButton);
    
    expect(screen.getByText(/criar conta/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirmar senha/i)).toBeInTheDocument();
    
    await user.click(screen.getByText(/faça login/i));
    expect(screen.getByText(/entrar/i)).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);
    
    // Esperar validação
    await waitFor(() => {
      expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
    });
  });

  it('should show error for invalid email format', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/seu@email.com/i);
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email válido/i)).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const toggleButton = screen.getByRole('button', { name: /toggle password/i });
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});