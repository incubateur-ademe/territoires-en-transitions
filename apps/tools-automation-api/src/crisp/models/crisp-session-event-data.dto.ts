export interface CrispSessionEventDataDto {
  website_id: string;
  session_id: string;
  data: { [key: string]: string | number };
}
