import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * EduVault Analytics Service
 * Inspired by Mixpanel/Amplitude for educational platform
 *
 * Tracks key metrics:
 * - User activation (Magic Moments)
 * - Conversion funnels
 * - Retention cohorts
 * - Feature usage
 */

interface AnalyticsEvent {
  userId?: string;
  sessionId: string;
  event: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

interface UserProperties {
  userId: string;
  properties: Record<string, any>;
}

interface MagicMoment {
  name: string;
  trigger: (event: AnalyticsEvent) => boolean;
  conversionMultiplier: number;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];

  // Define EduVault's Magic Moments (Netflix 10-second rule applied)
  private magicMoments: MagicMoment[] = [
    {
      name: 'first_course_enrolled',
      trigger: (e) => e.event === 'course_enrolled' && e.properties?.isFirstCourse,
      conversionMultiplier: 3.0, // 3x conversion rate
    },
    {
      name: 'first_lesson_completed',
      trigger: (e) => e.event === 'lesson_completed' && e.properties?.isFirstLesson,
      conversionMultiplier: 2.5,
    },
    {
      name: 'ai_tutor_first_use',
      trigger: (e) => e.event === 'ai_tutoring_used' && e.properties?.isFirstUse,
      conversionMultiplier: 4.0, // AI is our killer feature
    },
    {
      name: 'quiz_passed_first_time',
      trigger: (e) => e.event === 'quiz_completed' && e.properties?.passed && e.properties?.attemptNumber === 1,
      conversionMultiplier: 2.8,
    },
    {
      name: 'certificate_earned',
      trigger: (e) => e.event === 'certificate_issued',
      conversionMultiplier: 5.0, // Highest conversion moment
    },
    {
      name: 'daily_active_7_days',
      trigger: (e) => e.event === 'session_started' && e.properties?.consecutiveDays >= 7,
      conversionMultiplier: 6.0, // Habit formed
    },
  ];

  /**
   * Track event (Mixpanel-style)
   */
  async track(event: string, properties?: Record<string, any>, userId?: string) {
    const sessionId = this.getSessionId();

    const analyticsEvent: AnalyticsEvent = {
      userId,
      sessionId,
      event,
      properties: {
        ...properties,
        platform: this.getPlatform(),
        url: this.getCurrentUrl(),
        referrer: this.getReferrer(),
      },
      timestamp: new Date(),
    };

    // Store event
    this.events.push(analyticsEvent);

    // Check for magic moments
    await this.checkMagicMoments(analyticsEvent);

    // Save to database (async)
    this.saveEventToDatabase(analyticsEvent).catch(console.error);

    return analyticsEvent;
  }

  /**
   * Set user properties (for segmentation)
   */
  async identify(userId: string, properties: Record<string, any>) {
    // Update user profile
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Store analytics properties in metadata field (JSON)
        // In production, you'd have a dedicated analytics table
      },
    });
  }

  /**
   * Check for magic moments and trigger actions
   */
  private async checkMagicMoments(event: AnalyticsEvent) {
    for (const moment of this.magicMoments) {
      if (moment.trigger(event)) {
        console.log(`🎉 Magic Moment: ${moment.name} (${moment.conversionMultiplier}x conversion)`);

        // Trigger conversion optimization
        await this.triggerConversionAction(event.userId!, moment);
      }
    }
  }

  /**
   * Trigger actions based on magic moments (Spotify-style)
   */
  private async triggerConversionAction(userId: string, moment: MagicMoment) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) return;

    // Don't trigger if already premium
    if (user.membershipLevel !== 'FREE') return;

    switch (moment.name) {
      case 'first_course_enrolled':
        // Offer 50% discount within 24 hours
        await this.scheduleOffer(userId, 'premium_50_off', 24 * 60 * 60 * 1000);
        break;

      case 'ai_tutor_first_use':
        // Highlight premium AI features immediately
        await this.showUpgradeModal(userId, {
          message: 'Unlock unlimited AI tutoring with Premium',
          cta: 'Upgrade to Premium',
          discount: '3 months free',
        });
        break;

      case 'certificate_earned':
        // Offer blockchain verification upgrade
        await this.scheduleOffer(userId, 'blockchain_certificate', 12 * 60 * 60 * 1000);
        break;

      case 'daily_active_7_days':
        // Reward loyalty with special offer
        await this.scheduleOffer(userId, 'loyalty_40_off', 0);
        break;
    }
  }

  /**
   * Schedule premium offer (Spotify-style trigger)
   */
  private async scheduleOffer(userId: string, offerType: string, delayMs: number) {
    // In production, use a job queue (Bull, Agenda)
    setTimeout(async () => {
      console.log(`Sending ${offerType} to user ${userId}`);
      // Send email, push notification, or in-app message
    }, delayMs);
  }

  /**
   * Show upgrade modal
   */
  private async showUpgradeModal(userId: string, options: any) {
    // Store in user's pending notifications
    console.log(`Showing upgrade modal to ${userId}:`, options);
  }

  /**
   * Funnel analysis (Amplitude-style)
   */
  async analyzeFunnel(steps: string[], timeWindow: number = 7 * 24 * 60 * 60 * 1000) {
    // Group events by user
    const userEvents = new Map<string, AnalyticsEvent[]>();

    for (const event of this.events) {
      if (!event.userId) continue;

      if (!userEvents.has(event.userId)) {
        userEvents.set(event.userId, []);
      }
      userEvents.get(event.userId)!.push(event);
    }

    // Calculate funnel conversion
    const funnel = {
      steps: steps.map(step => ({ name: step, users: 0, conversionRate: 0 })),
      totalUsers: 0,
    };

    for (const [userId, events] of userEvents) {
      let currentStep = 0;
      const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      for (const event of sortedEvents) {
        if (event.event === steps[currentStep]) {
          funnel.steps[currentStep].users++;
          currentStep++;

          if (currentStep >= steps.length) break;
        }
      }
    }

    funnel.totalUsers = userEvents.size;

    // Calculate conversion rates
    for (let i = 0; i < funnel.steps.length; i++) {
      const previousUsers = i === 0 ? funnel.totalUsers : funnel.steps[i - 1].users;
      funnel.steps[i].conversionRate = previousUsers > 0
        ? funnel.steps[i].users / previousUsers
        : 0;
    }

    return funnel;
  }

  /**
   * Cohort retention analysis
   */
  async analyzeRetention(cohortSize: 'daily' | 'weekly' | 'monthly' = 'weekly') {
    // Group users by signup date
    const cohorts = new Map<string, Set<string>>();

    // Implementation would analyze user activity over time
    // and calculate retention rates per cohort

    return {
      cohortSize,
      periods: [], // [Day 0, Day 1, Day 7, Day 14, Day 30]
      cohorts: [], // Each cohort with retention %
    };
  }

  /**
   * Get session ID from cookie or generate new
   */
  private getSessionId(): string {
    // In browser: return cookie or generate
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getPlatform(): string {
    if (typeof window !== 'undefined') {
      return navigator.userAgent;
    }
    return 'server';
  }

  private getCurrentUrl(): string {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  }

  private getReferrer(): string {
    if (typeof document !== 'undefined') {
      return document.referrer;
    }
    return '';
  }

  /**
   * Save event to database
   */
  private async saveEventToDatabase(event: AnalyticsEvent) {
    // In production, save to a time-series database
    // or analytics platform (Mixpanel, Amplitude, PostHog)

    // For now, just log
    console.log('Analytics Event:', {
      event: event.event,
      userId: event.userId,
      properties: event.properties,
    });
  }

  /**
   * Get key metrics dashboard
   */
  async getDashboard() {
    return {
      // Activation metrics
      activation: {
        signups_today: await this.countEvents('signup_completed', 1),
        first_course_enrolled: await this.countEvents('first_course_enrolled', 7),
        first_lesson_completed: await this.countEvents('first_lesson_completed', 7),
        ai_tutor_used: await this.countEvents('ai_tutoring_used', 7),
      },

      // Engagement metrics
      engagement: {
        daily_active_users: await this.countUniqueUsers('session_started', 1),
        weekly_active_users: await this.countUniqueUsers('session_started', 7),
        monthly_active_users: await this.countUniqueUsers('session_started', 30),
      },

      // Conversion metrics
      conversion: {
        trial_to_paid: await this.calculateConversionRate('trial_started', 'payment_completed'),
        free_to_paid: await this.calculateConversionRate('signup_completed', 'payment_completed'),
      },

      // Revenue metrics
      revenue: {
        mrr: await this.calculateMRR(),
        arpu: await this.calculateARPU(),
      },
    };
  }

  private async countEvents(eventName: string, days: number): Promise<number> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.events.filter(e => e.event === eventName && e.timestamp > since).length;
  }

  private async countUniqueUsers(eventName: string, days: number): Promise<number> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const users = new Set(
      this.events
        .filter(e => e.event === eventName && e.timestamp > since && e.userId)
        .map(e => e.userId)
    );
    return users.size;
  }

  private async calculateConversionRate(fromEvent: string, toEvent: string): Promise<number> {
    const usersWithFrom = new Set(this.events.filter(e => e.event === fromEvent).map(e => e.userId));
    const usersWithTo = new Set(this.events.filter(e => e.event === toEvent).map(e => e.userId));

    let converted = 0;
    for (const userId of usersWithFrom) {
      if (usersWithTo.has(userId)) converted++;
    }

    return usersWithFrom.size > 0 ? converted / usersWithFrom.size : 0;
  }

  private async calculateMRR(): Promise<number> {
    // Calculate Monthly Recurring Revenue
    // In production, query actual payment data
    return 0;
  }

  private async calculateARPU(): Promise<number> {
    // Calculate Average Revenue Per User
    // In production, total revenue / total users
    return 0;
  }
}

export default new AnalyticsService();
