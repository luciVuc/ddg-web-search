import axios, { AxiosError } from "axios";
import { HttpClient } from "../../src";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("HttpClient", () => {
  let httpClient: HttpClient;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    httpClient = HttpClient.getInstance();
    consoleSpy = jest.spyOn(console, "error").mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("Singleton pattern", () => {
    it("should return the same instance", () => {
      const instance1 = HttpClient.getInstance();
      const instance2 = HttpClient.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("GET requests", () => {
    it("should make successful GET request", async () => {
      const mockData = { message: "success" };
      const mockResponse = { data: mockData };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await httpClient.get("https://example.com");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://example.com", {
        timeout: 10000,
      });
      expect(result).toBe(mockData);
    });

    it("should make GET request with custom config", async () => {
      const mockData = { message: "success" };
      const mockResponse = { data: mockData };
      const customConfig = { headers: { Authorization: "Bearer token" } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await httpClient.get("https://example.com", customConfig);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://example.com", {
        timeout: 10000,
        ...customConfig,
      });
      expect(result).toBe(mockData);
    });

    it("should handle GET request with Axios error response", async () => {
      const axiosError = new Error("Request failed") as AxiosError;
      axiosError.response = {
        status: 404,
        data: "Not found",
        statusText: "Not Found",
        headers: {},
        config: {} as never,
      };
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.get.mockRejectedValue(axiosError);

      await expect(httpClient.get("https://example.com")).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith("HTTP Error:", "Request failed");
      expect(consoleSpy).toHaveBeenCalledWith("Response status:", 404);
      expect(consoleSpy).toHaveBeenCalledWith("Response data:", "Not found");
    });

    it("should handle GET request with Axios error no response", async () => {
      const axiosError = new Error("Network error") as AxiosError;
      axiosError.request = {};
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.get.mockRejectedValue(axiosError);

      await expect(httpClient.get("https://example.com")).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith("HTTP Error:", "Network error");
      expect(consoleSpy).toHaveBeenCalledWith("No response received");
    });

    it("should handle GET request with generic Error", async () => {
      const genericError = new Error("Generic error");
      mockedAxios.isAxiosError.mockReturnValue(false);
      mockedAxios.get.mockRejectedValue(genericError);

      await expect(httpClient.get("https://example.com")).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Unexpected Error:",
        "Generic error",
      );
    });

    it("should handle GET request with unknown error", async () => {
      const unknownError = "string error";
      mockedAxios.isAxiosError.mockReturnValue(false);
      mockedAxios.get.mockRejectedValue(unknownError);

      await expect(httpClient.get("https://example.com")).rejects.toBe(
        unknownError,
      );

      expect(consoleSpy).toHaveBeenCalledWith("Unknown error occurred");
    });
  });

  describe("POST requests", () => {
    it("should make successful POST request", async () => {
      const mockData = { id: 1, created: true };
      const mockResponse = { data: mockData };
      const postData = { name: "test" };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await httpClient.post("https://example.com", postData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://example.com",
        postData,
        {
          timeout: 10000,
        },
      );
      expect(result).toBe(mockData);
    });

    it("should make POST request with custom config", async () => {
      const mockData = { id: 1, created: true };
      const mockResponse = { data: mockData };
      const postData = { name: "test" };
      const customConfig = { headers: { "Content-Type": "application/json" } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await httpClient.post(
        "https://example.com",
        postData,
        customConfig,
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://example.com",
        postData,
        {
          timeout: 10000,
          ...customConfig,
        },
      );
      expect(result).toBe(mockData);
    });

    it("should handle POST request with Axios error response", async () => {
      const postData = { name: "test" };
      const axiosError = new Error("Request failed") as AxiosError;
      axiosError.response = {
        status: 400,
        data: { error: "Bad request" },
        statusText: "Bad Request",
        headers: {},
        config: {} as never,
      };
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValue(axiosError);

      await expect(
        httpClient.post("https://example.com", postData),
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith("HTTP Error:", "Request failed");
      expect(consoleSpy).toHaveBeenCalledWith("Response status:", 400);
      expect(consoleSpy).toHaveBeenCalledWith("Response data:", {
        error: "Bad request",
      });
    });

    it("should handle POST request with Axios error no response", async () => {
      const postData = { name: "test" };
      const axiosError = new Error("Network timeout") as AxiosError;
      axiosError.request = {};
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValue(axiosError);

      await expect(
        httpClient.post("https://example.com", postData),
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith("HTTP Error:", "Network timeout");
      expect(consoleSpy).toHaveBeenCalledWith("No response received");
    });

    it("should handle POST request with generic Error", async () => {
      const postData = { name: "test" };
      const genericError = new Error("Generic post error");
      mockedAxios.isAxiosError.mockReturnValue(false);
      mockedAxios.post.mockRejectedValue(genericError);

      await expect(
        httpClient.post("https://example.com", postData),
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Unexpected Error:",
        "Generic post error",
      );
    });

    it("should handle POST request with unknown error", async () => {
      const postData = { name: "test" };
      const unknownError = { message: "unknown" };
      mockedAxios.isAxiosError.mockReturnValue(false);
      mockedAxios.post.mockRejectedValue(unknownError);

      await expect(
        httpClient.post("https://example.com", postData),
      ).rejects.toBe(unknownError);

      expect(consoleSpy).toHaveBeenCalledWith("Unknown error occurred");
    });
  });
});
