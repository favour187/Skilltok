/**
 * Browser Push Notifications (Web Push API)
 * Works as PWA when "Add to Home Screen" is enabled.
 */

export const PushNotify = {
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      alert('Your browser does not support push notifications.');
      return false;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  show(title: string, body: string, icon?: string): void {
    if (this.getPermission() !== 'granted') return;
    new Notification(title, {
      body,
      icon: icon || '/skilltok-logo.png',
      badge: '/skilltok-logo.png',
      tag: 'skilltok',
      requireInteraction: false,
      silent: false
    });
  },

  notifyNewOrder(buyerName: string, amount: string): void {
    this.show('💰 New Order Received!', `${buyerName} ordered your gig — ${amount} held in escrow`);
  },

  notifyNewMessage(senderName: string, preview: string): void {
    this.show(`💬 ${senderName}`, preview);
  },

  notifyPayoutSuccess(amount: string): void {
    this.show('✅ Payout Successful', `${amount} transferred to your account`);
  },

  notifyVideoLiked(count: number): void {
    this.show('❤️ New Like!', `Your video just got ${count} new likes`);
  },

  notifyReferralReward(amount: string): void {
    this.show('🎁 Referral Reward!', `You earned ${amount} from a friend signup`);
  }
};
