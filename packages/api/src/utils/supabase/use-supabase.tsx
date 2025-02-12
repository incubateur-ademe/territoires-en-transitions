'use client';

import { DBClient } from '@/api/typeUtils';
import { CookieOptionsWithName } from '@supabase/ssr';
import { createContext, ReactNode, useContext, useState } from 'react';
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

  return (
    <SupabaseContext.Provider value={supabaseClient}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const supabase = useContext(SupabaseContext);

  if (!supabase) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }

  return supabase;
};
