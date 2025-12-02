/**
 * Rate limiter utility for controlling request frequency
 * Implements a simple token bucket algorithm
 */
export class RateLimiter {
  private requests: number;
  private readonly limit: number;
  private readonly interval: number;
  private lastRequestTime: number;

  /**
   * Create a new RateLimiter instance
   * @param limit - Maximum number of requests allowed per interval
   * @param interval - Time interval in milliseconds
   */
  constructor(limit: number, interval: number) {
    if (limit <= 0) {
      throw new Error("Rate limit must be greater than 0");
    }
    if (interval <= 0) {
      throw new Error("Rate limit interval must be greater than 0");
    }

    this.requests = 0;
    this.limit = limit;
    this.interval = interval;
    this.lastRequestTime = Date.now();
  }

  /**
   * Acquire permission to make a request
   * Will wait if the rate limit has been exceeded
   * @returns Promise that resolves when permission is granted
   */
  public async acquire(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Reset counter if interval has passed
    if (timeSinceLastRequest >= this.interval) {
      this.requests = 0;
      this.lastRequestTime = now;
    }

    // If we're under the limit, allow the request
    if (this.requests < this.limit) {
      this.requests++;
      // Update last request time for each request to track properly
      if (this.requests === 1) {
        this.lastRequestTime = now;
      }
      return Promise.resolve();
    }

    // If we're over the limit, wait for the remainder of the interval
    const waitTime = this.interval - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));

    // Reset and allow the request
    this.requests = 1;
    this.lastRequestTime = Date.now();
    return Promise.resolve();
  }

  /**
   * Get current rate limiter status
   * @returns Object containing current status information
   */
  public getStatus(): { requests: number; limit: number; interval: number } {
    return {
      requests: this.requests,
      limit: this.limit,
      interval: this.interval,
    };
  }
}
