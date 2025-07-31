export interface BaseCrispResponse<TResponse> {
  error: boolean;
  reason: string;
  data: TResponse;
}
