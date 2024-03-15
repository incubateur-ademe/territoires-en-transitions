import {useEffect, useState} from 'react';
import {useCollectiviteContext} from 'providers/collectivite';

const useLandingPathname = () => {
  const [landingPathname, setLandingPathname] = useState('/landing');
  const {collectiviteId} = useCollectiviteContext();

  useEffect(() => {
    if (collectiviteId) {
      setLandingPathname(`/landing/collectivite/${collectiviteId}`);
    }
  }, [collectiviteId]);

  return landingPathname;
};

export default useLandingPathname;
