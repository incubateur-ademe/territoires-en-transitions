'use client';

import { CookieOptionsWithName } from '@supabase/ssr';
import { createContext, ReactNode, useContext, useState } from 'react';
import { DBClient } from '../../typeUtils';
import { createClient } from './browser-client';

const SupabaseContext = createContext<DBClient | null>(null);

export const SupabaseProvider = ({
  cookieOptions,
  children,
}: {
  cookieOptions: CookieOptionsWithName;
  children: ReactNode;
}) => {
  const [supabaseClient] = useState(createClient(cookieOptions));

  return <SupabaseContext value={supabaseClient}>{children}</SupabaseContext>;
};

export const useSupabase = () => {
  const supabase = useContext(SupabaseContext);

  if (!supabase) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }

  return supabase;
};
