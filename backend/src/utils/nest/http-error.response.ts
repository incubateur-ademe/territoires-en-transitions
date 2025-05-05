export interface HttpErrorResponse {
  stack?: string;

  code?: string;

  message: string;

  status: number;

  timestamp?: string;

  path?: string;

  details?: any;
}
