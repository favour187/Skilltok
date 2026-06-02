/**
 * User Registry - Cross-Device Cloud Authentication
 * All accounts live in the Railway PostgreSQL database.
 * Users can log in from any device with their email + password.
 */

import { User, Role } from '../types';
import { BackendService } from './api';

export const UserRegistry = {
  async create(data: {
    name: string;
    email: string;
    password: string;
    role: Role;
    phoneCountry?: string;
    phoneNumber?: string;
  }): Promise<{ success: boolean; user?: User; error?: string; otpSent?: boolean }> {
    // Validate password strength
    if (!data.password || data.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }
    if (!/[A-Z]/.test(data.password)) {
      return { success: false, error: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[0-9]/.test(data.password)) {
      return { success: false, error: 'Password must contain at least one number.' };
    }

    try {
      const result = await BackendService.register(
        data.name,
        data.email,
        data.password,
        data.role,
        data.phoneNumber
      );
      if (result.user) {
        return { success: true, user: result.user, otpSent: result.otpSent };
      }
      return { success: false, error: 'Registration failed. Please try again.' };
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message;
      if (errMsg?.includes('already registered')) {
        return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
      }
      if (errMsg?.includes('Network Error') || errMsg?.includes('timeout')) {
        return { success: false, error: 'Cannot reach the server. Please check your internet connection and try again.' };
      }
      return { success: false, error: errMsg };
    }
  },

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const result = await BackendService.login(email, password);
      if (result.user) {
        return { success: true, user: result.user };
      }
      return { success: false, error: 'Login failed. Please try again.' };
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message;
      if (errMsg?.includes('No account found')) {
        return { success: false, error: 'No account found with this email. Please register first.' };
      }
      if (errMsg?.includes('Incorrect password')) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }
      if (errMsg?.includes('suspended')) {
        return { success: false, error: 'Your account has been suspended. Contact support@skilltok.com.' };
      }
      if (errMsg?.includes('Network Error') || errMsg?.includes('timeout')) {
        return { success: false, error: 'Cannot reach the server. Please check your internet connection.' };
      }
      return { success: false, error: errMsg || 'Login failed. Please try again.' };
    }
  },

  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await BackendService.verifyOtp(email, otp);
      return { 
        success: result.verified, 
        error: result.verified ? undefined : 'Invalid or expired OTP code. Please check your email.' 
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message;
      if (errMsg?.includes('Network Error') || errMsg?.includes('timeout')) {
        return { success: false, error: 'Verification service unavailable. Please check your internet.' };
      }
      return { success: false, error: errMsg || 'OTP verification failed.' };
    }
  }
};
