'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../lib/authContext';

export default function EmailConfirmation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the token from URL parameters
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || type !== 'signup') {
          setError('Link de confirmação inválido.');
          setIsLoading(false);
          return;
        }

        // Confirm the email
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          console.error('Email confirmation error:', error);
          if (error.message.includes('expired')) {
            setError('O link de confirmação expirou. Por favor, solicite um novo link.');
          } else {
            setError('Erro ao confirmar email. Por favor, tente novamente.');
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
        console.error('Email confirmation error:', error);
        setError('Erro inesperado. Por favor, tente novamente.');
        setIsLoading(false);
      }
    };

    handleEmailConfirmation();
  }, [router, searchParams]);

  const handleResendConfirmation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const email = searchParams.get('email');
      if (!email) {
        setError('Email não encontrado. Por favor, tente novamente.');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-mail-check-line text-2xl text-blue-600 dark:text-blue-400"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Confirmação de Email
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Verificando sua conta...
            </p>
          </div>

          {isLoading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Processando confirmação...
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
                <button
                  onClick={handleResendConfirmation}
                  disabled={isLoading}
                  className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                >
                  {isLoading ? 'Reenviando...' : 'Reenviar email de confirmação'}
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Email confirmado com sucesso! Redirecionando para o app...
                </p>
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