
'use client';

import * as React from 'react';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!isPasswordReset) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (!isLogin && !formData.name) {
        newErrors.name = 'Name is required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});
    try {
      if (isPasswordReset) {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/auth/reset-password`
        });
        if (error) throw error;
        setResetEmailSent(true);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        onAuthSuccess();
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { 
            data: { name: formData.name },
            emailRedirectTo: `${window.location.origin}/auth/confirm`
          }
        });
        if (error) throw error;
        
        // Check if email confirmation is required
        if (data.user && !data.session) {
          setEmailConfirmationSent(true);
        } else {
          onAuthSuccess();
          onClose();
        }
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'Authentication failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });
      if (error) throw error;
      setErrors({ general: 'Email de confirmação reenviado! Verifique sua caixa de entrada.' });
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to resend confirmation email.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isPasswordReset ? 'Reset Password' : isLogin ? 'Sign In' : 'Sign Up'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Close modal"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
          </div>
        )}
        {resetEmailSent ? (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">Password reset email sent! Check your inbox.</p>
          </div>
        ) : emailConfirmationSent ? (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
              Email de confirmação enviado! Verifique sua caixa de entrada e clique no link para confirmar sua conta.
            </p>
            <button
              onClick={handleResendConfirmation}
              disabled={isLoading}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              {isLoading ? 'Reenviando...' : 'Reenviar email de confirmação'}
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !isPasswordReset && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter your full name"
              />
              {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Enter your email"
            />
            {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
          </div>
          {!isPasswordReset && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter your password"
              />
              {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center justify-center">
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                {isPasswordReset ? 'Sending...' : isLogin ? 'Signing In...' : 'Creating Account...'}
              </div>
            ) : (
              isPasswordReset ? 'Send Reset Email' : isLogin ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>
        )}
        <div className="mt-6 text-center">
          {!isPasswordReset && !emailConfirmationSent && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <button
                onClick={() => setIsPasswordReset(true)}
                className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
              >
                Forgot Password?
              </button>
            </p>
          )}
          {isPasswordReset ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <button
                onClick={() => { setIsPasswordReset(false); setResetEmailSent(false); }}
                className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
              >
                Back to Sign In
              </button>
            </p>
          ) : emailConfirmationSent ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <button
                onClick={() => { setEmailConfirmationSent(false); setIsLogin(true); }}
                className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
              >
                Back to Sign In
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
