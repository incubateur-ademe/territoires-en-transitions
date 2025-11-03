import { BaseCrispResponse } from '@/tools/crisp/models/base-crisp.response';

export type GetCrispSessionResponse = BaseCrispResponse<CrispSession>;

export interface CrispSession {
  session_url?: string;
  session_id: string;
  website_id: string;
  availability: string;
  created_at: number;
  is_blocked: boolean;
  mentions: any[];
  meta: CrispSessionMeta;
  participants: Participant[];
  state: string;
  status: number;
  unread: Unread;
  updated_at: number;
  people_id: string;
  last_message: string;
  preview_message: PreviewMessage;
  compose: Compose;
  assigned: Assigned;
  active: Active;
}

export interface Active {
  now: boolean;
}

export interface Assigned {
  user_id: string;
}

export interface Compose {
  operator: { [key: string]: Operator };
}

export interface Operator {
  type: string;
  timestamp: number;
  excerpt: null | string;
  user: User;
}

export interface User {
  nickname: string;
  user_id: string;
}

export interface CrispSessionMeta {
  nickname: string;
  email: string;
  phone: string;
  avatar: string;
  ip: string;
  data: { [key: string]: string | number };
  device: Device;
  segments: string[];
  subject: string;
}

export interface Device {
  geolocation: Geolocation;
  locales: string[];
  system: System;
}

export interface Geolocation {
  country: string;
  coordinates: Coordinates;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface System {
  os: Browser;
  engine: Browser;
  browser: Browser;
  useragent: string;
}

export type Browser = Record<string, unknown>;

export interface Participant {
  type: string;
  target: string;
}

export interface PreviewMessage {
  type: string;
  from: string;
  excerpt: string;
  fingerprint: number;
}

export interface Unread {
  operator: number;
  visitor: number;
}
