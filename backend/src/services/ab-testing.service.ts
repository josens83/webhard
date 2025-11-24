import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * A/B Testing Service (Optimizely/VWO-style)
 *
 * Features:
 * - Deterministic user assignment
 * - Statistical significance calculation
 * - Segment-based testing
 * - Revenue tracking
 */

interface ExperimentVariant {
  id: string;
  name: string;
  allocation: number; // 0-100
  config: Record<string, any>;
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: ExperimentVariant[];
  targetSegment?: string;
  startDate: Date;
  endDate?: Date;
  successMetrics: string[];
  status: 'draft' | 'running' | 'completed' | 'paused';
}

interface ExperimentResult {
  variantId: string;
  metrics: {
    users: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    avgRevenuePerUser: number;
  };
  statisticalSignificance: number; // p-value
  confidence: number; // 95% CI
}

class ABTestingService {
  private experiments: Map<string, Experiment> = new Map();

  /**
   * Create new experiment
   */
  async createExperiment(config: {
    name: string;
    description: string;
    variants: Omit<ExperimentVariant, 'id'>[];
    successMetrics: string[];
    targetSegment?: string;
  }): Promise<Experiment> {
    // Validate allocation sums to 100
    const totalAllocation = config.variants.reduce((sum, v) => sum + v.allocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Variant allocations must sum to 100');
    }

    const experiment: Experiment = {
      id: crypto.randomUUID(),
      name: config.name,
      description: config.description,
      variants: config.variants.map(v => ({
        ...v,
        id: crypto.randomUUID(),
      })),
      targetSegment: config.targetSegment,
      startDate: new Date(),
      successMetrics: config.successMetrics,
      status: 'draft',
    };

    this.experiments.set(experiment.id, experiment);
    return experiment;
  }

  /**
   * Assign user to variant (deterministic)
   * Same user always gets same variant
   */
  assignUser(experimentId: string, userId: string): ExperimentVariant | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check if user is in target segment
    if (experiment.targetSegment && !this.isInSegment(userId, experiment.targetSegment)) {
      return null;
    }

    // Deterministic assignment using hash
    const hash = crypto
      .createHash('md5')
      .update(`${userId}-${experimentId}`)
      .digest('hex');

    const bucket = parseInt(hash.slice(0, 8), 16) % 100;

    // Assign to variant based on allocation
    let cumulative = 0;
    for (const variant of experiment.variants) {
      cumulative += variant.allocation;
      if (bucket < cumulative) {
        // Log assignment
        this.logAssignment(experimentId, userId, variant.id);
        return variant;
      }
    }

    return experiment.variants[experiment.variants.length - 1];
  }

  /**
   * Get experiment config for user
   */
  getVariantConfig(experimentId: string, userId: string): Record<string, any> | null {
    const variant = this.assignUser(experimentId, userId);
    return variant ? variant.config : null;
  }

  /**
   * Track conversion
   */
  async trackConversion(
    experimentId: string,
    userId: string,
    metric: string,
    value?: number
  ) {
    const variant = this.assignUser(experimentId, userId);
    if (!variant) return;

    // Log conversion
    console.log('Conversion:', {
      experiment: experimentId,
      variant: variant.id,
      user: userId,
      metric,
      value,
    });

    // In production, save to analytics database
  }

  /**
   * Analyze experiment results
   */
  async analyzeExperiment(experimentId: string): Promise<{
    experiment: Experiment;
    results: ExperimentResult[];
    winner?: ExperimentVariant;
    recommendation: string;
  }> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    // Get results for each variant
    const results: ExperimentResult[] = await Promise.all(
      experiment.variants.map(async (variant) => {
        const metrics = await this.getVariantMetrics(experimentId, variant.id);
        const baseline = experiment.variants[0]; // Control group

        return {
          variantId: variant.id,
          metrics,
          statisticalSignificance: this.calculatePValue(metrics, await this.getVariantMetrics(experimentId, baseline.id)),
          confidence: 0.95,
        };
      })
    );

    // Determine winner
    const winner = this.determineWinner(results);

    // Generate recommendation
    const recommendation = this.generateRecommendation(results, winner);

    return {
      experiment,
      results,
      winner: winner ? experiment.variants.find(v => v.id === winner.variantId) : undefined,
      recommendation,
    };
  }

  /**
   * Get metrics for a variant
   */
  private async getVariantMetrics(experimentId: string, variantId: string) {
    // In production, query from analytics database
    // For now, return mock data
    return {
      users: Math.floor(Math.random() * 1000) + 100,
      conversions: Math.floor(Math.random() * 100) + 10,
      conversionRate: Math.random() * 0.3 + 0.05,
      revenue: Math.random() * 10000 + 1000,
      avgRevenuePerUser: Math.random() * 100 + 10,
    };
  }

  /**
   * Calculate statistical significance (p-value)
   */
  private calculatePValue(
    variant: { users: number; conversions: number },
    control: { users: number; conversions: number }
  ): number {
    // Simplified z-test for proportions
    const p1 = variant.conversions / variant.users;
    const p2 = control.conversions / control.users;
    const pPool = (variant.conversions + control.conversions) / (variant.users + control.users);

    const se = Math.sqrt(pPool * (1 - pPool) * (1 / variant.users + 1 / control.users));
    const z = (p1 - p2) / se;

    // Convert to p-value (two-tailed)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

    return pValue;
  }

  /**
   * Normal CDF (for p-value calculation)
   */
  private normalCDF(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }

  /**
   * Determine winner
   */
  private determineWinner(results: ExperimentResult[]): ExperimentResult | undefined {
    // Find variant with best conversion rate and statistical significance
    const control = results[0];
    const variants = results.slice(1);

    for (const variant of variants) {
      if (
        variant.metrics.conversionRate > control.metrics.conversionRate &&
        variant.statisticalSignificance < 0.05 // 95% confidence
      ) {
        return variant;
      }
    }

    return undefined;
  }

  /**
   * Generate recommendation
   */
  private generateRecommendation(results: ExperimentResult[], winner?: ExperimentResult): string {
    if (!winner) {
      return 'No clear winner. Continue running experiment or try different variants.';
    }

    const control = results[0];
    const improvement = ((winner.metrics.conversionRate - control.metrics.conversionRate) / control.metrics.conversionRate) * 100;

    return `Variant ${winner.variantId} wins with ${improvement.toFixed(1)}% improvement in conversion rate. Recommend rolling out to 100% of users.`;
  }

  /**
   * Check if user is in target segment
   */
  private isInSegment(userId: string, segment: string): boolean {
    // In production, check user properties
    // For now, return true
    return true;
  }

  /**
   * Log user assignment
   */
  private logAssignment(experimentId: string, userId: string, variantId: string) {
    console.log('Assignment:', { experimentId, userId, variantId });
    // In production, save to database
  }

  /**
   * Start experiment
   */
  async startExperiment(experimentId: string) {
    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      experiment.status = 'running';
      experiment.startDate = new Date();
    }
  }

  /**
   * Stop experiment
   */
  async stopExperiment(experimentId: string) {
    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      experiment.status = 'completed';
      experiment.endDate = new Date();
    }
  }
}

// Example experiments for EduVault
export const EduVaultExperiments = {
  // Pricing experiment
  pricing: {
    name: 'Premium Pricing Test',
    description: 'Test different pricing tiers',
    variants: [
      { name: 'Control', allocation: 33, config: { price: 9.99 } },
      { name: 'Higher Price', allocation: 33, config: { price: 12.99 } },
      { name: 'Lower Price', allocation: 34, config: { price: 7.99 } },
    ],
    successMetrics: ['payment_completed', 'revenue'],
  },

  // Onboarding experiment
  onboarding: {
    name: 'Onboarding Flow Test',
    description: 'Test different onboarding approaches',
    variants: [
      { name: 'Control (Original)', allocation: 50, config: { flow: 'original' } },
      { name: 'Personalized', allocation: 50, config: { flow: 'personalized', askGoals: true } },
    ],
    successMetrics: ['first_course_enrolled', 'activation_rate'],
  },

  // Free trial length
  trial: {
    name: 'Trial Length Test',
    description: 'Test different trial durations',
    variants: [
      { name: '7 Days', allocation: 33, config: { trialDays: 7 } },
      { name: '14 Days', allocation: 33, config: { trialDays: 14 } },
      { name: '30 Days', allocation: 34, config: { trialDays: 30 } },
    ],
    successMetrics: ['trial_to_paid_conversion'],
  },

  // AI feature positioning
  aiFeature: {
    name: 'AI Feature Highlight',
    description: 'Test different ways to highlight AI tutoring',
    variants: [
      { name: 'Control', allocation: 50, config: { highlight: false } },
      { name: 'Prominent Badge', allocation: 50, config: { highlight: true, badge: 'AI-Powered' } },
    ],
    successMetrics: ['ai_tutoring_used', 'engagement'],
  },
};

export default new ABTestingService();
