'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';
import { ApiRequestError } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
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
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setServerError(err.apiError.message);
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    }
  };

  if (submitted) {
    return (
      <AuthLayout title="Check your inbox">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" aria-hidden="true" />
            </div>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            If <strong>{getValues('email')}</strong> is registered, you&apos;ll receive a reset link shortly. The link expires in <strong>30 minutes</strong>.
          </p>
          <p className="text-xs text-gray-500">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button type="button" onClick={() => setSubmitted(false)} className="font-semibold text-blue-600 underline">
              try again
            </button>.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we'll send you a reset link">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>
      <div className="mt-6 text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}