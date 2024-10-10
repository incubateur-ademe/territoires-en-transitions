import * as jwt from 'jsonwebtoken';

export enum SupabaseRole {
  AUTHENTICATED = 'authenticated',
  SERVICE_ROLE = 'service_role',
  ANON = 'anon', // Anonymous
}
export interface SupabaseJwtPayload extends jwt.JwtPayload {
  email?: string;
  phone?: string;
  app_metadata?: {
    provider: string;
    providers: string[];
  };
  session_id: string;
  role: SupabaseRole;
  is_anonymous: boolean;
}