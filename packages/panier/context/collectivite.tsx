'use client';

import {useParams, usePathname} from 'next/navigation';
import {createContext, useContext, useEffect, useState} from 'react';

export const CollectiviteContext = createContext<number | null>(null);

export const useCollectiviteContext = () => {
  return useContext(CollectiviteContext);
};

const CollectiviteProvider = ({children}: {children: React.ReactNode}) => {
  const pathname = usePathname();
  const pathnameArray = pathname.split('/');
  const params = useParams();

  const [collectivite, setCollectivite] = useState<number | null>(null);

  useEffect(() => {
    if (pathnameArray.length && pathnameArray[1] === 'landing') {
      if (pathnameArray.length === 4 && pathnameArray[2] === 'collectivite') {
        const collectiviteId = params.id;
        setCollectivite(parseInt(collectiviteId as string));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CollectiviteContext.Provider value={collectivite}>
      {children}
    </CollectiviteContext.Provider>
  );
};

export default CollectiviteProvider;
