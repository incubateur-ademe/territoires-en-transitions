import {
  createClient,
  SignInWithPasswordCredentials,
  SupabaseClient,
} from '@supabase/supabase-js';
import {
  AuthUser,
  isAuthenticatedUser,
} from '../../src/auth/models/auth.models';
import { YOLO_DODO } from './test-users.samples';

let supabase: SupabaseClient;

export async function signInWith(credentials: SignInWithPasswordCredentials) {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
  }

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
    data: { user },
  } = await signInWith(credentials);

  if (!user) {
    expect.fail('Could not authenticated user yolododo');
  }

  const authUser = {
    id: user.id,
    role: user.role,
    isAnonymous: user.is_anonymous,
  } as AuthUser;

  if (!isAuthenticatedUser(authUser)) {
    expect.fail('Could not authenticated user yolododo');
  }

  return authUser;
}
