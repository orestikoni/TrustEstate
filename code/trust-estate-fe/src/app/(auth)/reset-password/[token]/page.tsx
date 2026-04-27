'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth';
import { ApiRequestError } from '@/lib/api-client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null);
    try {
      await authService.resetPassword(token, { password: data.password });
      setIsSuccess(true);
      setTimeout(() => router.replace('/login'), 3000);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setServerError(
          err.statusCode === 400
            ? 'This reset link is invalid or has expired. Please request a new one.'
            : err.apiError.message,
        );
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    }
  };

  // No token in URL
  if (!token) {
    return (
      <AuthLayout title="Invalid Link">
        <div className="text-center space-y-6">
          <p className="text-gray-700">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg shadow-blue-600/30 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300"
          >
            Request new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Success screen
  if (isSuccess) {
    return (
      <AuthLayout title="Password reset!">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden="true" />
            </div>
          </div>

          <div className="text-center space-y-3">
            <h3 className="text-xl font-semibold text-gray-900">Password reset successful!</h3>
            <p className="text-gray-700">Your password has been successfully reset.</p>
            <p className="text-sm text-gray-600 pt-2">
              You will be redirected to the login page in a few seconds…
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/login"
              className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/30 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5"
            >
              Go to login now
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Main form
  return (
    <AuthLayout
      title="Create new password"
      subtitle="Please enter your new password below."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {serverError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}{' '}
            {serverError.includes('expired') && (
              <Link href="/forgot-password" className="underline font-semibold">
                Request a new link
              </Link>
            )}
          </div>
        )}

        {/* Password requirements box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">Password must contain:</p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• At least 8 characters</li>
            <li>• One uppercase letter</li>
            <li>• One lowercase letter</li>
            <li>• One number</li>
          </ul>
        </div>

        <Input
          label="New Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Enter new password"
          leftIcon={<Lock className="h-5 w-5" />}
          error={errors.password?.message}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-gray-400 hover:text-blue-600 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
          {...register('password')}
        />

        <Input
          label="Confirm New Password"
          type={showConfirm ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Confirm new password"
          leftIcon={<Lock className="h-5 w-5" />}
          error={errors.confirmPassword?.message}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="text-gray-400 hover:text-blue-600 transition-colors"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          fullWidth
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="h-5 w-5" />}
        >
          Reset password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Remember your password?{' '}
        <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}