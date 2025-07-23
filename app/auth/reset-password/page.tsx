'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../lib/authContext';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    // Check if we have a token in the URL
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    console.log('Reset password page loaded with:', { token, type });
    
    // For password reset, we just need to check if we have the token
    if (token && type === 'recovery') {
      setHasToken(true);
    } else {
      setError('Link de recuperação inválido ou expirado.');
    }
    
    setIsPageLoading(false);
  }, [searchParams]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the correct password reset API
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password reset error:', error);
        if (error.message.includes('expired')) {
          setError('O link de recuperação expirou. Por favor, solicite um novo link.');
        } else {
          setError('Erro ao redefinir senha. Por favor, tente novamente.');
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        setSuccess(true);
        setIsLoading(false);
        // Redirect to main page after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Erro inesperado. Por favor, tente novamente.');
      setIsLoading(false);
    }
  };

  const handleResendResetEmail = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const email = searchParams.get('email');
      if (!email) {
        setError('Email não encontrado. Por favor, tente novamente.');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        setError('Erro ao reenviar email. Por favor, tente novamente.');
      } else {
        setSuccess(true);
        setError(null);
      }
    } catch (error) {
      setError('Erro inesperado. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Carregando...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasToken) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-error-warning-line text-2xl text-red-600 dark:text-red-400"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Link Inválido
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                O link de recuperação é inválido ou expirou.
              </p>
            </div>

            {error && (
              <div className="mb-6">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
                  <button
                    onClick={handleResendResetEmail}
                    disabled={isLoading}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                  >
                    {isLoading ? 'Reenviando...' : 'Solicitar novo link de recuperação'}
                  </button>
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Voltar para o app
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-lock-password-line text-2xl text-blue-600 dark:text-blue-400"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Redefinir Senha
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Digite sua nova senha abaixo.
            </p>
          </div>

          {error && (
            <div className="mb-6">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Senha redefinida com sucesso! Redirecionando para o app...
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nova Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Digite sua nova senha"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Confirme sua nova senha"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Voltar para o app
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 