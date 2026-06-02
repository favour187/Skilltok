/**
 * Referral & Loyalty System
 * Users earn ₦500 (or $1) per successful friend signup + first order.
 * Tracks points, referral codes, conversions.
 */

import { api } from './api';

const STORAGE_KEY = 'skilltok_referral_data';

export interface ReferralData {
  myCode: string;
  totalReferred: number;
  totalEarnedNgn: number;
  pendingNgn: number;
  loyaltyPoints: number;
  referredBy?: string;
  invitedFriends: { email: string; status: 'pending' | 'signed_up' | 'completed'; reward: number; date: string }[];
}

function generateReferralCode(userId: string, name: string): string {
  const prefix = (name || 'USR').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
  const suffix = userId.replace(/-/g, '').substring(0, 5).toUpperCase();
  return `${prefix}-${suffix}`;
}

export const Referral = {
  getMyData(userId: string, userName: string): ReferralData {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    const fresh: ReferralData = {
      myCode: generateReferralCode(userId, userName),
      totalReferred: 0,
      totalEarnedNgn: 0,
      pendingNgn: 0,
      loyaltyPoints: 50, // Welcome bonus
      invitedFriends: []
    };
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(fresh));
    return fresh;
  },

  inviteFriend(userId: string, userName: string, friendEmail: string): { success: boolean; message: string } {
    const data = this.getMyData(userId, userName);
    if (data.invitedFriends.some(f => f.email.toLowerCase() === friendEmail.toLowerCase())) {
      return { success: false, message: 'You already invited this email.' };
    }
    data.invitedFriends.push({
      email: friendEmail,
      status: 'pending',
      reward: 500,
      date: new Date().toLocaleDateString()
    });
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(data));

    // Fire-and-forget backend call (won't block UI)
    api.post('/api/referrals/invite', { friendEmail, referrerCode: data.myCode }).catch(() => {});

    return { success: true, message: `Invitation sent to ${friendEmail}!` };
  },

  getShareLink(code: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://skilltok.com';
    return `${origin}?ref=${code}`;
  },

  getShareMessage(code: string): string {
    return `Join me on SkillTok — the TikTok-style freelance marketplace! Watch creators, hire instantly, and get ₦500 welcome bonus when you sign up with my code: ${code}\n${this.getShareLink(code)}`;
  },

  addLoyaltyPoints(userId: string, userName: string, points: number, reason: string): void {
    const data = this.getMyData(userId, userName);
    data.loyaltyPoints += points;
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(data));
    console.log(`+${points} loyalty points: ${reason}`);
  }
};
