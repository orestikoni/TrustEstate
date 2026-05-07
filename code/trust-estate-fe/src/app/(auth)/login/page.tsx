'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth, ROLE_DASHBOARD } from '@/store/auth.context';
import { authService } from '@/services/auth.service';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { ApiRequestError } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const { user, tokens } = await authService.login({
        email: data.email,
        password: data.password,
      });
      login(user, tokens);
      router.replace(ROLE_DASHBOARD[user.role]);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setServerError(err.apiError.message);
      } else if (err instanceof TypeError) {
        setServerError('Unable to connect to the server. Please ensure the backend is running.');
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <AuthLayout title="Welcome back">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5" aria-label="Sign in form">
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

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your password"
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

        <div className="flex items-center">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register('rememberMe')}
            />
            <span className="text-sm font-medium text-gray-700">Remember me</span>
          </label>
        </div>

        <Button type="submit" fullWidth isLoading={isSubmitting} rightIcon={<ArrowRight className="h-5 w-5" />}>
          Sign in to your account
        </Button>

      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
          Create account
        </Link>
      </p>
    </AuthLayout>
  );
}

