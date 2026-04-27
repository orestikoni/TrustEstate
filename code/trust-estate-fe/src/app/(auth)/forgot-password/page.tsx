'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';
import { ApiRequestError } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    try {
      await authService.forgotPassword(data);
      setIsSubmitted(true);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setServerError(err.apiError.message);
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <AuthLayout
      title={isSubmitted ? 'Check your email' : 'Reset your password'}
      subtitle={
        isSubmitted
          ? "If an account exists for that email, we've sent a password reset link."
          : "Enter your email address and we'll send you a link to reset your password."
      }
    >
      {!isSubmitted ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          {serverError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="h-5 w-5" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="h-5 w-5" />}
          >
            Send reset link
          </Button>

          <Link
            href="/login"
            className="w-full flex justify-center items-center gap-2 py-4 px-4 border-2 border-gray-200 rounded-xl text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200/50 transition-all hover:shadow-md"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to login
          </Link>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="h-8 w-8 text-blue-600" aria-hidden="true" />
            </div>
          </div>

          {/* Message */}
          <div className="text-center space-y-3">
            <p className="text-gray-700">We&apos;ve sent a password reset link to:</p>
            <p className="font-semibold text-gray-900 text-lg">{getValues('email')}</p>
            <p className="text-sm text-gray-600 pt-2">
              The link will expire in 1 hour for security reasons.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="w-full py-3.5 px-4 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200/50 transition-all hover:shadow-md"
            >
              Didn&apos;t receive the email? Try again
            </button>

            <Link
              href="/login"
              className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/30 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to login
            </Link>
          </div>
        </div>
      )}

      {/* Help text */}
      {!isSubmitted && (
        <p className="mt-6 text-center text-sm text-gray-500">
          Need help?{' '}
          <a href="#" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Contact support
          </a>
        </p>
      )}
    </AuthLayout>
  );
}