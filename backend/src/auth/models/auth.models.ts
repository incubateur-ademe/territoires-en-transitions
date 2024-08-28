import * as jwt from 'jsonwebtoken';
export interface SupabaseJwtPayload extends jwt.JwtPayload {
  email?: string;
  phone?: string;
  app_metadata?: {
    provider: string;
    providers: string[];
  };
  session_id: string;
  role: 'authenticated';
  is_anonymous: boolean;
}
