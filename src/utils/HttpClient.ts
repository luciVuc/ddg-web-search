import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

// Constants
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Singleton HTTP client for making HTTP requests
 * Provides centralized error handling and logging
 */
export class HttpClient {
  private static instance: HttpClient;

  private constructor() {}

  /**
   * Get the singleton instance of HttpClient
   * @returns The singleton HttpClient instance
   */
  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  /**
   * Perform a GET request
   * @param url - The URL to request
   * @param config - Optional Axios request configuration
   * @returns Promise resolving to the response data
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.get(url, {
        timeout: DEFAULT_TIMEOUT_MS,
        ...config,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Perform a POST request
   * @param url - The URL to request
   * @param data - The data to send in the request body
   * @param config - Optional Axios request configuration
   * @returns Promise resolving to the response data
   */
  public async post<T>(
    url: string,
    data: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.post(url, data, {
        timeout: DEFAULT_TIMEOUT_MS,
        ...config,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Handle and log HTTP errors
   * @param error - The error object to handle
   */
  private handleError(error: unknown): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error("HTTP Error:", axiosError.message);
      if (axiosError.response) {
        console.error("Response status:", axiosError.response.status);
        console.error("Response data:", axiosError.response.data);
      } else if (axiosError.request) {
        console.error("No response received");
      }
    } else if (error instanceof Error) {
      console.error("Unexpected Error:", error.message);
    } else {
      console.error("Unknown error occurred");
    }
  }
}
