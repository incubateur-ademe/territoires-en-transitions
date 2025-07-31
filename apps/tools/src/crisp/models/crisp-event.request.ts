export interface CrispEventRequest<TEventData> {
  website_id: string;
  event: string;
  data: TEventData;
  timestamp: number;
}
