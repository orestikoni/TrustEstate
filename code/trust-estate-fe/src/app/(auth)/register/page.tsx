'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { authService } from '@/services/auth.service'; 
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { ApiRequestError } from '@/lib/api-client';
import { cn } from '@/utils/cn';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      role: undefined,
      agencyType: undefined,
      agencyName: '',
      professionalQualifications: '',
    },
  });

  const selectedRole = watch('role');
  const agencyType = watch('agencyType');

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const { acceptTerms, confirmPassword, ...payload } = data;
      await authService.register(payload);
      const isPending = data.role === 'Agent' || data.role === 'PropertyInspector';
      router.replace(isPending ? '/login?pending=1' : '/login?registered=1');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setServerError(err.apiError.message);
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Join TrustEstate and find your next property">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5" aria-label="Registration form">
        {serverError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            type="text"
            autoComplete="given-name"
            placeholder="John"
            leftIcon={<User className="h-5 w-5" />}
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last name"
            type="text"
            autoComplete="family-name"
            placeholder="Doe"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

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
          autoComplete="new-password"
          placeholder="Create a strong password"
          leftIcon={<Lock className="h-5 w-5" />}
          hint="Min 8 characters with uppercase, lowercase and a number"
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
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          leftIcon={<Lock className="h-5 w-5" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Input
          label="Phone number (optional)"
          type="tel"
          autoComplete="tel"
          placeholder="+355 6X XXX XXXX"
          leftIcon={<Phone className="h-5 w-5" />}
          error={errors.phoneNumber?.message}
          {...register('phoneNumber')}
        />

        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <RoleSelector
              value={field.value ?? ''}
              onChange={field.onChange}
              error={errors.role?.message}
            />
          )}
        />

        {selectedRole === 'Agent' && (
          <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Agent details</p>
            <div>
              <p className="block text-sm font-semibold text-gray-700 mb-2">Agency type</p>
              <div className="grid grid-cols-2 gap-3">
                {(['Independent', 'Agency'] as const).map((type) => (
                  <label
                    key={type}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all',
                      agencyType === type ? 'border-blue-500 bg-white' : 'border-gray-200 bg-white/60 hover:border-blue-300',
                    )}
                  >
                    <input type="radio" value={type} className="text-blue-600 focus:ring-blue-500" {...register('agencyType')} />
                    <span className="text-sm font-medium text-gray-800">{type}</span>
                  </label>
                ))}
              </div>
              {errors.agencyType && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">{errors.agencyType.message}</p>
              )}
            </div>
            {agencyType === 'Agency' && (
              <Input
                label="Agency name"
                type="text"
                placeholder="e.g. Prime Properties Albania"
                error={errors.agencyName?.message}
                {...register('agencyName')}
              />
            )}
          </div>
        )}

        {selectedRole === 'PropertyInspector' && (
          <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Inspector details</p>
            <div>
              <label htmlFor="qualifications" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Professional qualifications
              </label>
              <textarea
                id="qualifications"
                rows={3}
                placeholder="List your certifications, licenses, and relevant experience…"
                className="block w-full rounded-xl border-2 border-gray-200 bg-white/60 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                {...register('professionalQualifications')}
              />
              {errors.professionalQualifications && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">{errors.professionalQualifications.message}</p>
              )}
            </div>
          </div>
        )}

        {(selectedRole === 'Agent' || selectedRole === 'PropertyInspector') && (
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <svg className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-amber-800">
              <strong>Pending verification:</strong> Your account will be reviewed by an Admin within 72 hours before you can log in.
            </p>
          </div>
        )}

        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
              {...register('acceptTerms')}
            />
            <span className="text-sm text-gray-700">
              I agree to the{' '}
              <Link href="/terms" className="font-semibold text-blue-600 hover:text-blue-700">Terms and Conditions</Link>
              {' '}and{' '}
              <Link href="/privacy" className="font-semibold text-blue-600 hover:text-blue-700">Privacy Policy</Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">{errors.acceptTerms.message}</p>
          )}
        </div>

        <Button type="submit" fullWidth isLoading={isSubmitting} rightIcon={<ArrowRight className="h-5 w-5" />}>
          Create Account
        </Button>

        <div className="relative py-2" aria-hidden="true">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 font-medium">or sign up with</span>
          </div>
        </div>

        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200/50 transition-all hover:shadow-md"
        >
          <GoogleLogo />
          Continue with Google
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

function GoogleLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}