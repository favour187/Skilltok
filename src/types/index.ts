export type Role = 'buyer' | 'seller' | 'hybrid' | 'agency' | 'admin';
export type PlanType = 'free' | 'pro' | 'agency';

export interface SkillCertificate {
  id: string;
  skill: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  issuedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string;
  role: Role;
  plan: PlanType;
  bio?: string;
  isVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  followersCount: number;
  followingCount: number;
  skills?: string[];
  skillCertificates?: SkillCertificate[];
  joinedDate: string;
  phoneCountry?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  totalViews?: number;
  totalEarnings?: number;
  avgRating?: number;
  certifications?: string[];
}

export interface ServicePackage {
  tier: 'basic' | 'standard' | 'premium';
  priceCents: number;
  deliveryDays: number;
  revisions: number;
  features: string[];
}

export interface Service {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar: string;
  title: string;
  description: string;
  category: string;
  subCategory?: string;
  priceCents: number;
  deliveryDays: number;
  rating: number;
  reviewCount: number;
  image: string;
  galleryImages?: string[];
  tags: string[];
  features: string[];
  isActive: boolean;
  isFeatured?: boolean;
  isPromoted?: boolean;
  createdAt: string;
  packages?: ServicePackage[];
  requirementsForm?: string[];
  faqs?: { q: string; a: string }[];
}

export interface Review {
  id: string;
  serviceId: string;
  transactionId: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  sellerId: string;
  rating: number;
  comment: string;
  communicationRating: number;
  serviceAsDescribedRating: number;
  recommendRating: number;
  createdAt: string;
  sellerReply?: string;
}

export interface SavedGig {
  serviceId: string;
  userId: string;
  savedAt: string;
}

export interface VideoComment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userUsername: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
  isLikedByMe?: boolean;
}

export interface Video {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  category: string;
  views: number;
  likes: number;
  shares: number;
  commentsCount: number;
  isLikedByMe?: boolean;
  isSavedByMe?: boolean;
  linkedServiceId?: string; // Links directly to a freelance service!
  createdAt: string;
}

export interface Transaction {
  id: string;
  serviceId: string;
  serviceTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  basePriceCents: number;
  buyerFeeCents: number;
  sellerFeeCents: number;
  processingFeeCents: number;
  platformNetCents: number;
  paymentMethod: 'paystack' | 'flutterwave' | 'bank_transfer' | string;
  status: 'pending' | 'delivered' | 'completed' | 'disputed' | 'refunded';
  createdAt: string;
  deliveryProofUrl?: string;
  deliveryNotes?: string;
  deliveredAt?: string;
  autoReleaseDate?: string;
  disputeReason?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participant: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'order' | 'message' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface FeeCalculationResult {
  basePriceCents: number;
  buyerFee: number; // 5%
  buyerPays: number; // base + buyerFee
  sellerFeeRate: number; // 5%, 4%, or 3%
  sellerFee: number;
  sellerNet: number;
  processingFee: number; // Stripe/PayPal
  platformNet: number;
}
