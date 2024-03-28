'use client';

import {useParams, usePathname} from 'next/navigation';
import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

type CollectiviteContextType = {
  collectiviteId: number | null;
  setCollectiviteId: Dispatch<SetStateAction<number | null>>;
};

const contextDefaultValue: CollectiviteContextType = {
  collectiviteId: null,
  setCollectiviteId: (collectiviteId: SetStateAction<number | null>) => {},
};

/**
 * Contexte permettant de récupérer la collectivité courante
 */
export const CollectiviteContext = createContext(contextDefaultValue);

export const useCollectiviteContext = () => {
  return useContext(CollectiviteContext);
};

/**
 * Provider pour le contexte de la collectivité
 */
export const CollectiviteProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const pathnameArray = pathname.split('/');
  const params = useParams();

  const [collectiviteId, setCollectiviteId] = useState(
    contextDefaultValue.collectiviteId,
  );

  useEffect(() => {
    if (pathnameArray.length && pathnameArray[1] === 'landing') {
      if (pathnameArray.length === 4 && pathnameArray[2] === 'collectivite') {
        const collectiviteId = params.id;
        setCollectiviteId(parseInt(collectiviteId as string));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CollectiviteContext.Provider value={{collectiviteId, setCollectiviteId}}>
      {children}
    </CollectiviteContext.Provider>
  );
};
