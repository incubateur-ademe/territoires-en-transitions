import {useEffect, useState} from 'react';
import {useCollectiviteContext} from 'context/collectivite';

const useLandingPathname = () => {
  const [landingPathname, setLandingPathname] = useState('/landing');
  const collectivite = useCollectiviteContext();

  useEffect(() => {
    if (collectivite) {
      setLandingPathname(`/landing/collectivite/${collectivite}`);
    }
  }, [collectivite]);

  return landingPathname;
};

export default useLandingPathname;
