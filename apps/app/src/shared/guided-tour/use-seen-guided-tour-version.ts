'use client';

import { useCallback } from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';

type UseSeenGuidedTourVersionArgs = {
  id: string;
  version: string;
};

type SeenGuidedTourVersion = {
  hasSeen: boolean;
  markSeen: () => void;
};

const useSeenGuidedTourVersion = ({
  id,
  version,
}: UseSeenGuidedTourVersionArgs): SeenGuidedTourVersion => {
  const [seenVersion, setSeenVersion] = useLocalStorage<string>(
    `tet_guided_tour_${id}`,
    undefined,
    { raw: true }
  );
  const markSeen = useCallback(
    () => setSeenVersion(version),
    [setSeenVersion, version]
  );

  return { hasSeen: seenVersion === version, markSeen };
};

export { useSeenGuidedTourVersion };
