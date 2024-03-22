'use client';

import {User} from '@supabase/supabase-js';
import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from 'react';

type UserContextType = {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
};

const contextDefaultValue: UserContextType = {
  user: null,
  setUser: (user: SetStateAction<User | null>) => {},
};

/**
 * Contexte permettant de récupérer le user
 *
 * Si l'utilisateur est `null` on considère qu'il n'est pas connecté.
 */
export const UserContext = createContext(contextDefaultValue);

export const useUserContext = () => {
  return useContext(UserContext);
};

/**
 * Provider pour le contexte du user
 */
export const UserProvider = ({children}: {children: React.ReactNode}) => {
  const [user, setUser] = useState(contextDefaultValue.user);

  return (
    <UserContext.Provider value={{user, setUser}}>
      {children}
    </UserContext.Provider>
  );
};
