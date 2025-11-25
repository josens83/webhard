import { PrismaClient, MembershipLevel } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Freemium Optimization Service
 * Inspired by: Spotify, Dropbox, Zoom
 *
 * Strategy:
 * - Show value first (unlimited courses)
 * - Introduce limitations gradually
 * - Trigger upgrades at "magic moments"
 * - Personalized pricing & offers
 */

interface FreemiumLimits {
  aiTutoringSessions: number;
  downloadableCertificates: number;
  concurrentEnrollments: number;
  offlineAccess: boolean;
  blockchainVerification: boolean;
  advancedAnalytics: boolean;
}

interface UpgradeOffer {
  userId: string;
  offerType: string;
  discount: number;
  expiresAt: Date;
  triggeredBy: string; // Magic moment that triggered this
}

class FreemiumOptimizationService {
  // Define limits for each tier
  private tierLimits: Record<MembershipLevel, FreemiumLimits> = {
    FREE: {
      aiTutoringSessions: 3, // 3 per month
      downloadableCertificates: 0,
      concurrentEnrollments: 2,
      offlineAccess: false,
      blockchainVerification: false,
      advancedAnalytics: false,
    },
    BRONZE: {
      aiTutoringSessions: 10,
      downloadableCertificates: 1,
      concurrentEnrollments: 5,
      offlineAccess: false,
      blockchainVerification: false,
      advancedAnalytics: false,
    },
    SILVER: {
      aiTutoringSessions: 50,
      downloadableCertificates: 5,
      concurrentEnrollments: 10,
      offlineAccess: true,
      blockchainVerification: false,
      advancedAnalytics: true,
    },
    GOLD: {
      aiTutoringSessions: Infinity,
      downloadableCertificates: Infinity,
      concurrentEnrollments: Infinity,
      offlineAccess: true,
      blockchainVerification: true,
      advancedAnalytics: true,
    },
    PLATINUM: {
      aiTutoringSessions: Infinity,
      downloadableCertificates: Infinity,
      concurrentEnrollments: Infinity,
      offlineAccess: true,
      blockchainVerification: true,
      advancedAnalytics: true,
    },
    VIP: {
      aiTutoringSessions: Infinity,
      downloadableCertificates: Infinity,
      concurrentEnrollments: Infinity,
      offlineAccess: true,
      blockchainVerification: true,
      advancedAnalytics: true,
    },
  };

  /**
   * Check if user can use feature
   */
  async canUseFeature(userId: string, feature: keyof FreemiumLimits): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    const limits = this.tierLimits[user.membershipLevel];
    const currentLimit = limits[feature];

    // If boolean, return directly
    if (typeof currentLimit === 'boolean') {
      return currentLimit;
    }

    // If number, check usage
    if (feature === 'aiTutoringSessions') {
      const usage = await this.getAITutoringUsage(userId);
      return usage < currentLimit;
    }

    if (feature === 'concurrentEnrollments') {
      const enrollments = await prisma.enrollment.count({
        where: { studentId: userId, status: 'ACTIVE' },
      });
      return enrollments < currentLimit;
    }

    return true;
  }

  /**
   * Get current usage for a feature
   */
  async getFeatureUsage(userId: string, feature: keyof FreemiumLimits): Promise<{
    used: number;
    limit: number;
    percentage: number;
  }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const limit = this.tierLimits[user.membershipLevel][feature];

    let used = 0;
    if (feature === 'aiTutoringSessions') {
      used = await this.getAITutoringUsage(userId);
    } else if (feature === 'concurrentEnrollments') {
      used = await prisma.enrollment.count({
        where: { studentId: userId, status: 'ACTIVE' },
      });
    }

    const numericLimit = typeof limit === 'boolean' ? (limit ? 1 : 0) : limit;
    const percentage = numericLimit === Infinity ? 0 : (used / numericLimit) * 100;

    return {
      used,
      limit: numericLimit === Infinity ? -1 : numericLimit,
      percentage,
    };
  }

  /**
   * Trigger upgrade prompt at "magic moment"
   */
  async triggerUpgradePrompt(userId: string, trigger: string): Promise<UpgradeOffer | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.membershipLevel !== 'FREE') {
      return null;
    }

    // Define offers based on trigger
    const offers: Record<string, { type: string; discount: number; duration: number }> = {
      ai_limit_reached: {
        type: 'unlimited_ai_50_off',
        discount: 50,
        duration: 48 * 60 * 60 * 1000, // 48 hours
      },
      certificate_requested: {
        type: 'premium_3months_free',
        discount: 100, // Free for 3 months
        duration: 24 * 60 * 60 * 1000, // 24 hours
      },
      enrollment_limit_reached: {
        type: 'premium_40_off',
        discount: 40,
        duration: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
      daily_streak_7: {
        type: 'loyalty_30_off',
        discount: 30,
        duration: 14 * 24 * 60 * 60 * 1000, // 14 days
      },
    };

    const offer = offers[trigger];
    if (!offer) return null;

    const upgradeOffer: UpgradeOffer = {
      userId,
      offerType: offer.type,
      discount: offer.discount,
      expiresAt: new Date(Date.now() + offer.duration),
      triggeredBy: trigger,
    };

    // Save offer to database (in production)
    console.log('💰 Upgrade offer created:', upgradeOffer);

    // Send notification
    await this.sendUpgradeNotification(upgradeOffer);

    return upgradeOffer;
  }

  /**
   * Gradual limitation introduction (Spotify strategy)
   */
  async applyGradualLimitations(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const daysSinceSignup = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Week 1: No limitations (honeymoon period)
    if (daysSinceSignup < 7) {
      console.log('🍯 Honeymoon period - no limitations');
      return;
    }

    // Week 2-4: Light limitations
    if (daysSinceSignup < 28) {
      console.log('⚠️  Introducing light limitations');
      // In production, adjust user experience slightly
      return;
    }

    // Month 2+: Full free tier limitations
    console.log('🔒 Full free tier limitations active');
  }

  /**
   * Calculate optimal price for user (dynamic pricing)
   */
  async calculateOptimalPrice(userId: string, baseTier: MembershipLevel): Promise<number> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return 0;

    const basePrices: Record<MembershipLevel, number> = {
      FREE: 0,
      BRONZE: 4.99,
      SILVER: 9.99,
      GOLD: 19.99,
      PLATINUM: 39.99,
      VIP: 99.99,
    };

    let price = basePrices[baseTier];

    // Student discount (50%)
    if (user.email.endsWith('.edu')) {
      price *= 0.5;
    }

    // Early adopter discount (20%)
    const daysSinceSignup = (Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceSignup < 7) {
      price *= 0.8;
    }

    // Volume discount for institutions
    if (user.isInstitution) {
      price *= 0.7; // 30% off
    }

    return Math.round(price * 100) / 100;
  }

  /**
   * Show upgrade modal
   */
  async showUpgradeModal(userId: string, context: {
    feature: string;
    limit: number;
    used: number;
  }): Promise<{
    title: string;
    message: string;
    cta: string;
    benefits: string[];
  }> {
    const messages: Record<string, any> = {
      aiTutoringSessions: {
        title: 'Unlock Unlimited AI Tutoring',
        message: `You've used ${context.used} of ${context.limit} AI tutoring sessions this month.`,
        cta: 'Upgrade to Premium',
        benefits: [
          'Unlimited AI tutoring',
          '24/7 personalized help',
          'Advanced learning paths',
          'Priority support',
        ],
      },
      downloadableCertificates: {
        title: 'Get Blockchain-Verified Certificates',
        message: 'Unlock professional certificates with blockchain verification.',
        cta: 'Upgrade Now',
        benefits: [
          'Downloadable PDF certificates',
          'Blockchain verification',
          'LinkedIn integration',
          'Lifetime access',
        ],
      },
      concurrentEnrollments: {
        title: 'Enroll in More Courses',
        message: `You've reached the limit of ${context.limit} active courses.`,
        cta: 'Upgrade to Learn More',
        benefits: [
          'Unlimited course enrollments',
          'Access all premium content',
          'Offline downloads',
          'Advanced analytics',
        ],
      },
    };

    return messages[context.feature] || messages.aiTutoringSessions;
  }

  /**
   * Send upgrade notification
   */
  private async sendUpgradeNotification(offer: UpgradeOffer): Promise<void> {
    console.log(`📧 Sending upgrade offer to user ${offer.userId}:`, {
      type: offer.offerType,
      discount: `${offer.discount}%`,
      expires: offer.expiresAt,
    });

    // In production:
    // - Send email
    // - Send push notification
    // - Show in-app banner
  }

  /**
   * Get AI tutoring usage for current month
   */
  private async getAITutoringUsage(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await prisma.aIInteraction.count({
      where: {
        userId,
        interactionType: 'TUTORING',
        createdAt: { gte: startOfMonth },
      },
    });

    return count;
  }
}

export default new FreemiumOptimizationService();
