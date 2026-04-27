'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

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
  const [success, setSuccess] = useState(false);
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
      setSuccess(true);
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

  if (success) {
    return (
      <AuthLayout title="Password updated!">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" aria-hidden="true" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Your password has been reset. Redirecting you to sign in…</p>
          <Link href="/login" className="inline-block font-bold text-blue-600 hover:text-blue-700 text-sm">
            Go to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password for your account">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {serverError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}{' '}
            {serverError.includes('expired') && (
              <Link href="/forgot-password" className="underline font-semibold">Request a new link</Link>
            )}
          </div>
        )}
        <Input
          label="New password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Create a strong password"
          leftIcon={<Lock className="h-5 w-5" />}
          hint="Min 8 characters with uppercase, lowercase and a number"
          error={errors.password?.message}
          rightElement={
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-gray-400 hover:text-blue-600 transition-colors" aria-label={showPassword ? 'Hide' : 'Show'}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
          {...register('password')}
        />
        <Input
          label="Confirm new password"
          type={showConfirm ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repeat your new password"
          leftIcon={<Lock className="h-5 w-5" />}
          error={errors.confirmPassword?.message}
          rightElement={
            <button type="button" onClick={() => setShowConfirm((v) => !v)} className="text-gray-400 hover:text-blue-600 transition-colors" aria-label={showConfirm ? 'Hide' : 'Show'}>
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
          {...register('confirmPassword')}
        />
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}