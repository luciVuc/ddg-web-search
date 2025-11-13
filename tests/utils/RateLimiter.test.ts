import { RateLimiter } from "../../src";

describe("RateLimiter", () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(2, 1000); // 2 requests per second
  });

  describe("constructor", () => {
    it("should create rate limiter with valid parameters", () => {
      const customRateLimiter = new RateLimiter(5, 2000);
      expect(customRateLimiter).toBeDefined();
      expect(customRateLimiter.getStatus()).toEqual({
        requests: 0,
        limit: 5,
        interval: 2000,
      });
    });

    it("should throw error for invalid limit", () => {
      expect(() => new RateLimiter(0, 1000)).toThrow(
        "Rate limit must be greater than 0",
      );
      expect(() => new RateLimiter(-1, 1000)).toThrow(
        "Rate limit must be greater than 0",
      );
    });

    it("should throw error for invalid interval", () => {
      expect(() => new RateLimiter(1, 0)).toThrow(
        "Rate limit interval must be greater than 0",
      );
      expect(() => new RateLimiter(1, -100)).toThrow(
        "Rate limit interval must be greater than 0",
      );
    });
  });

  describe("acquire method", () => {
    it("should allow requests within the limit", async () => {
      const start = Date.now();
      await rateLimiter.acquire();
      await rateLimiter.acquire();
      const elapsed = Date.now() - start;

      // Should complete quickly since we're within the limit
      expect(elapsed).toBeLessThan(100);
    });

    it("should delay requests exceeding the limit", async () => {
      const start = Date.now();

      await rateLimiter.acquire(); // First request
      await rateLimiter.acquire(); // Second request
      await rateLimiter.acquire(); // Third request should be delayed

      const elapsed = Date.now() - start;

      // Should take at least 1 second for the third request
      expect(elapsed).toBeGreaterThanOrEqual(900); // Allow some timing variance
    }, 5000);

    it("should allow requests after the time window", async () => {
      await rateLimiter.acquire(); // First request
      await rateLimiter.acquire(); // Second request

      // Wait for more than the time window
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const start = Date.now();
      await rateLimiter.acquire(); // Should be allowed now
      const elapsed = Date.now() - start;

      // Should complete quickly since the window has reset
      expect(elapsed).toBeLessThan(100);
    }, 5000);

    it("should handle single request rate limiter", async () => {
      const singleRateLimiter = new RateLimiter(1, 500);

      const start = Date.now();
      await singleRateLimiter.acquire(); // First request
      await singleRateLimiter.acquire(); // Second request should be delayed
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(450); // Allow some timing variance
    }, 3000);

    it("should handle multiple rapid acquisitions", async () => {
      const fastRateLimiter = new RateLimiter(3, 1000);

      const start = Date.now();
      const promises = [];

      // Make 5 requests rapidly
      for (let i = 0; i < 5; i++) {
        promises.push(fastRateLimiter.acquire());
      }

      await Promise.all(promises);
      const elapsed = Date.now() - start;

      // Should delay the last 2 requests
      expect(elapsed).toBeGreaterThanOrEqual(900);
    }, 5000);

    it("should maintain separate timing for different instances", async () => {
      const rateLimiter1 = new RateLimiter(1, 1000);
      const rateLimiter2 = new RateLimiter(1, 1000);

      const start = Date.now();

      // Both should acquire immediately since they're separate instances
      await Promise.all([rateLimiter1.acquire(), rateLimiter2.acquire()]);

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    it("should work with very short intervals", async () => {
      const fastRateLimiter = new RateLimiter(2, 100); // 100ms interval

      const start = Date.now();
      await fastRateLimiter.acquire();
      await fastRateLimiter.acquire();
      await fastRateLimiter.acquire(); // Should delay
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(80); // Allow timing variance
    }, 1000);

    it("should throw error for zero rate limit", () => {
      expect(() => new RateLimiter(0, 1000)).toThrow(
        "Rate limit must be greater than 0",
      );
    });

    it("should handle high rate limits efficiently", async () => {
      const highRateLimiter = new RateLimiter(100, 1000);

      const start = Date.now();
      const promises = [];

      // Make 50 requests (well within limit)
      for (let i = 0; i < 50; i++) {
        promises.push(highRateLimiter.acquire());
      }

      await Promise.all(promises);
      const elapsed = Date.now() - start;

      // Should complete quickly
      expect(elapsed).toBeLessThan(200);
    });
  });

  describe("timing accuracy", () => {
    it("should maintain accurate timing over multiple windows", async () => {
      const preciseRateLimiter = new RateLimiter(1, 500);

      const times = [];

      for (let i = 0; i < 3; i++) {
        const start = Date.now();
        await preciseRateLimiter.acquire();
        times.push(Date.now() - start);
      }

      // First request should be immediate
      expect(times[0]).toBeLessThan(50);

      // Subsequent requests should be delayed
      expect(times[1]).toBeGreaterThanOrEqual(450);
      expect(times[2]).toBeGreaterThanOrEqual(450);
    }, 3000);
  });
});
