import { ConvertJwtToAuthUserService } from '@/backend/users/convert-jwt-to-auth-user.service';
import {
  createClient,
  SignInWithPasswordCredentials,
  SupabaseClient,
} from '@supabase/supabase-js';
import {
  AuthRole,
  AuthUser,
  isAuthenticatedUser,
} from '../src/users/models/auth.models';
import { getTestApp } from './app-utils';
import { YOLO_DODO } from './test-users.samples';

let supabase: SupabaseClient;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }
  return supabase;
};

export async function signInWith(credentials: SignInWithPasswordCredentials) {
  const supabase = getSupabaseClient();
  return await supabase.auth.signInWithPassword(credentials);
}

export async function getAuthToken(
  credentials: SignInWithPasswordCredentials = YOLO_DODO
): Promise<string> {
  const response = await signInWith(credentials);
  return response.data.session?.access_token || '';
}

export async function getAuthUser(
  credentials: SignInWithPasswordCredentials = YOLO_DODO
) {
  const {
    data: { user, session },
  } = await signInWith(credentials);

  if (!user || !session) {
    expect.fail('Could not authenticate user yolododo');
  }

  const convertJwtToAuthUserService = (await getTestApp()).get(
    ConvertJwtToAuthUserService
  );

  const authUser = await convertJwtToAuthUserService.convertJwtToAuthUser(
    session.access_token
  );

  if (!isAuthenticatedUser(authUser)) {
    expect.fail('Could not authenticated user yolododo');
  }

  return authUser;
}

export function getAnonUser(): AuthUser<AuthRole.ANON> {
  return {
    id: null,
    role: AuthRole.ANON,
    isAnonymous: true,
    jwtPayload: { role: AuthRole.ANON },
  };
}

export function getServiceRoleUser(): AuthUser<AuthRole.SERVICE_ROLE> {
  return {
    id: null,
    role: AuthRole.SERVICE_ROLE,
    isAnonymous: true,
    jwtPayload: { role: AuthRole.SERVICE_ROLE },
  };
}
