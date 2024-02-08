'use client';

import {ReactNode, createContext, useEffect, useState} from 'react';
import {Session} from '@supabase/supabase-js';
import {createClient} from 'src/supabase/client';
import {clearAuthTokens, setAuthTokens} from './authTokens';

const SessionContext = createContext<Session | null>(null);

// const domain = location.hostname.split('.').toSpliced(0, 1).join('.');

type SessionProviderProps = {
  children: ReactNode;
  domain: string;
};

export const SessionProvider = ({children, domain}: SessionProviderProps) => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentSession(null);
        clearAuthTokens(domain);
      } else if (
        session &&
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')
      ) {
        setCurrentSession(session);
        setAuthTokens(session, domain);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, domain]);

  return (
    <SessionContext.Provider value={currentSession}>
      {children}
    </SessionContext.Provider>
  );
};
