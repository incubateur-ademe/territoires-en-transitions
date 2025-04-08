export interface CrispMessageReceivedEventDataDto {
  website_id: string;
  type: string;
  from: string;
  origin: string;
  content: string;
  fingerprint: number;
  user: CrispUserReference;
  mentions: any[];
  timestamp: number;
  stamped: boolean;
  session_id: string;
  inbox_id: null;
}

export interface CrispUserReference {
  nickname: string;
  user_id: string;
}
