'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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
      
      if (!isLogin && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
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
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email);
        if (error) throw error;
        setResetEmailSent(true);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        router.push('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { name: formData.name } }
        });
        if (error) throw error;
        router.push('/');
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'Authentication failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">NotesApp</h1>
          <p className="login-subtitle">
            {isPasswordReset 
              ? 'Reset your password' 
              : isLogin 
                ? 'Welcome back' 
                : 'Create your account'
            }
          </p>
        </div>

        {errors.general && (
          <div className="error-message">
            <p>{errors.general}</p>
          </div>
        )}

        {resetEmailSent ? (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h3>Check your email</h3>
            <p>We've sent a password reset link to {formData.email}</p>
            <button 
              className="back-btn"
              onClick={() => {
                setIsPasswordReset(false);
                setResetEmailSent(false);
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
              }}
            >
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && !isPasswordReset && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            
            {!isPasswordReset && (
              <>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                  />
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                {!isLogin && (
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                  </div>
                )}
              </>
            )}

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <div className="loading-spinner">
                  <i className="ri-loader-4-line"></i>
                  <span>
                    {isPasswordReset ? 'Sending...' : isLogin ? 'Signing In...' : 'Creating Account...'}
                  </span>
                </div>
              ) : (
                isPasswordReset ? 'Send Reset Email' : isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
        )}

        <div className="login-footer">
          {!isPasswordReset && (
            <button
              className="link-btn"
              onClick={() => setIsPasswordReset(true)}
            >
              Forgot your password?
            </button>
          )}
          
          {isPasswordReset ? (
            <button
              className="link-btn"
              onClick={() => {
                setIsPasswordReset(false);
                setResetEmailSent(false);
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
              }}
            >
              Back to login
            </button>
          ) : (
            <div className="auth-switch">
              <span>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </span>
              <button
                className="link-btn"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                  setErrors({});
                }}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 