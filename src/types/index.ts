// Minimal types for Swagger setup
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
