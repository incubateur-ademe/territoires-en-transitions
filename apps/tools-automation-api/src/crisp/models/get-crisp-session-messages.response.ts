export interface GetCrispSessionMessagesResponse {
  error: boolean;
  reason: string;
  data: CrispSessionMessage[];
}

export interface CrispSessionMessage {
  session_id: string;
  website_id: string;
  fingerprint: number;
  type: CrispSessionMessageType;
  from: From;
  origin: Delivered;
  content: CrispSessionMessageContent | string;
  user: CrispUser;
  original?: Original;
  delivered: Delivered;
  read: Delivered;
  preview: PreviewElement[];
  mentions: any[];
  stamped: boolean;
  timestamp: number;
}

export interface CrispSessionMessageContent {
  namespace?: string;
  text?: string;
  name?: string;
  url?: string;
  type?: string;
}

export enum Delivered {
  Chat = 'chat',
  Email = 'email',
  Empty = '',
}

export enum From {
  Operator = 'operator',
  User = 'user',
}

export interface Original {
  original_id: string;
}

export interface PreviewElement {
  url: string;
  website: string;
  title: string;
  preview: PreviewPreview;
}

export interface PreviewPreview {
  excerpt: string;
  image: string;
}

export enum CrispSessionMessageType {
  Event = 'event',
  File = 'file',
  Text = 'text',
}

export interface CrispUser {
  user_id?: string;
  nickname: string;
  type?: string;
  email?: string;
}
