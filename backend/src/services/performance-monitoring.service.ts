import { performance } from 'perf_hooks';

/**
 * Performance Monitoring Service
 * Inspired by: Netflix, Linear
 *
 * Goals:
 * - < 2s initial load (Netflix)
 * - < 100ms interaction latency (Linear)
 * - Real-time performance tracking
 * - Alert on degradation
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  apiResponse: number; // ms
  databaseQuery: number; // ms
  externalAPI: number; // ms
  cpuUsage: number; // percentage
  memoryUsage: number; // MB
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThresholds = {
    apiResponse: 200, // 200ms (Stripe-level)
    databaseQuery: 50, // 50ms
    externalAPI: 1000, // 1s
    cpuUsage: 80, // 80%
    memoryUsage: 512, // 512MB
  };

  private timers: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  startTimer(operation: string): void {
    this.timers.set(operation, performance.now());
  }

  /**
   * End timing and record metric
   */
  endTimer(operation: string, metadata?: Record<string, any>): number {
    const start = this.timers.get(operation);
    if (!start) {
      console.warn(`Timer not found for operation: ${operation}`);
      return 0;
    }

    const duration = performance.now() - start;
    this.timers.delete(operation);

    this.recordMetric({
      name: operation,
      value: duration,
      timestamp: new Date(),
      metadata,
    });

    // Alert if exceeds threshold
    this.checkThreshold(operation, duration);

    return duration;
  }

  /**
   * Measure async function execution
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startTimer(operation);
    try {
      const result = await fn();
      return result;
    } finally {
      this.endTimer(operation, metadata);
    }
  }

  /**
   * Record custom metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Log slow operations
    if (this.isSlow(metric)) {
      console.warn(`🐌 Slow operation: ${metric.name} took ${metric.value.toFixed(2)}ms`);
    }

    // Keep only last 10000 metrics in memory
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  /**
   * Check if metric exceeds threshold
   */
  private isSlow(metric: PerformanceMetric): boolean {
    const thresholdMap: Record<string, number> = {
      'api:': this.thresholds.apiResponse,
      'db:': this.thresholds.databaseQuery,
      'external:': this.thresholds.externalAPI,
    };

    for (const [prefix, threshold] of Object.entries(thresholdMap)) {
      if (metric.name.startsWith(prefix) && metric.value > threshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check threshold and alert
   */
  private checkThreshold(operation: string, duration: number): void {
    if (operation.startsWith('api:') && duration > this.thresholds.apiResponse) {
      this.alert({
        severity: 'warning',
        message: `API response time exceeded threshold`,
        operation,
        duration,
        threshold: this.thresholds.apiResponse,
      });
    }
  }

  /**
   * Send alert (integrate with Slack, PagerDuty, etc.)
   */
  private alert(alert: {
    severity: 'info' | 'warning' | 'critical';
    message: string;
    operation: string;
    duration: number;
    threshold: number;
  }): void {
    console.error(`🚨 [${alert.severity.toUpperCase()}] ${alert.message}`, {
      operation: alert.operation,
      duration: `${alert.duration.toFixed(2)}ms`,
      threshold: `${alert.threshold}ms`,
      overage: `${((duration / alert.threshold) * 100 - 100).toFixed(1)}%`,
    });

    // In production, send to alerting system
    // - Slack webhook
    // - PagerDuty
    // - Datadog
  }

  /**
   * Get performance summary
   */
  getSummary(timeWindow: number = 60 * 60 * 1000): {
    operations: Record<string, { count: number; avg: number; p50: number; p95: number; p99: number }>;
    slowest: PerformanceMetric[];
  } {
    const since = new Date(Date.now() - timeWindow);
    const recentMetrics = this.metrics.filter((m) => m.timestamp > since);

    // Group by operation
    const grouped = new Map<string, number[]>();
    for (const metric of recentMetrics) {
      if (!grouped.has(metric.name)) {
        grouped.set(metric.name, []);
      }
      grouped.get(metric.name)!.push(metric.value);
    }

    // Calculate statistics
    const operations: Record<string, any> = {};
    for (const [name, values] of grouped) {
      const sorted = values.sort((a, b) => a - b);
      operations[name] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: this.percentile(sorted, 0.5),
        p95: this.percentile(sorted, 0.95),
        p99: this.percentile(sorted, 0.99),
      };
    }

    // Find slowest operations
    const slowest = recentMetrics
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return { operations, slowest };
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Monitor system resources
   */
  async monitorResources(): Promise<{
    cpu: number;
    memory: number;
    uptime: number;
  }> {
    const mem = process.memoryUsage();
    const memoryMB = mem.heapUsed / 1024 / 1024;

    // Check thresholds
    if (memoryMB > this.thresholds.memoryUsage) {
      this.alert({
        severity: 'warning',
        message: `Memory usage high: ${memoryMB.toFixed(2)}MB`,
        operation: 'system:memory',
        duration: memoryMB,
        threshold: this.thresholds.memoryUsage,
      });
    }

    return {
      cpu: process.cpuUsage().user / 1000000, // Convert to seconds
      memory: memoryMB,
      uptime: process.uptime(),
    };
  }

  /**
   * Get Web Vitals compatible metrics
   */
  getWebVitals(): {
    fcp: number | null; // First Contentful Paint
    lcp: number | null; // Largest Contentful Paint
    fid: number | null; // First Input Delay
    cls: number | null; // Cumulative Layout Shift
    ttfb: number | null; // Time to First Byte
  } {
    // These would be collected from the frontend using web-vitals library
    return {
      fcp: null,
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null,
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const summary = this.getSummary();
    const resources = process.memoryUsage();

    let report = '📊 Performance Report\n';
    report += '='.repeat(50) + '\n\n';

    report += '🎯 Top Operations:\n';
    const sorted = Object.entries(summary.operations)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10);

    for (const [name, stats] of sorted) {
      report += `  ${name}:\n`;
      report += `    Count: ${stats.count}\n`;
      report += `    Avg: ${stats.avg.toFixed(2)}ms\n`;
      report += `    P95: ${stats.p95.toFixed(2)}ms\n`;
      report += `    P99: ${stats.p99.toFixed(2)}ms\n\n`;
    }

    report += '🐌 Slowest Operations:\n';
    for (const metric of summary.slowest.slice(0, 5)) {
      report += `  ${metric.name}: ${metric.value.toFixed(2)}ms\n`;
    }

    report += '\n💾 Memory Usage:\n';
    report += `  Heap Used: ${(resources.heapUsed / 1024 / 1024).toFixed(2)}MB\n`;
    report += `  Heap Total: ${(resources.heapTotal / 1024 / 1024).toFixed(2)}MB\n`;
    report += `  RSS: ${(resources.rss / 1024 / 1024).toFixed(2)}MB\n`;

    return report;
  }
}

// Express middleware for automatic API timing
export const performanceMiddleware = (service: PerformanceMonitoringService) => {
  return (req: any, res: any, next: any) => {
    const operation = `api:${req.method}:${req.path}`;
    service.startTimer(operation);

    // Override res.send to capture response time
    const originalSend = res.send;
    res.send = function (data: any) {
      service.endTimer(operation, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
      });
      return originalSend.call(this, data);
    };

    next();
  };
};

export default new PerformanceMonitoringService();
