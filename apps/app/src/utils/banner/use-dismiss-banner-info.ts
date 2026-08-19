import { useState } from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import {
  BannerDismissal,
  deserializeBannerDismissal,
  isBannerDismissalActive,
} from './banner-info.utils';

const STORAGE_KEY = 'tet_banner_info_dismissal';

export function useDismissBannerInfo(modifiedAt: string): {
  isVisible: boolean;
  dismiss: () => void;
} {
  const [dismissal, setDismissal] = useLocalStorage<
    BannerDismissal | undefined
  >(STORAGE_KEY, undefined, {
    raw: false,
    serializer: (value) => JSON.stringify(value),
    deserializer: deserializeBannerDismissal,
  });

  const [isVisible, setIsVisible] = useState(
    () => !isBannerDismissalActive({ dismissal, modifiedAt, now: Date.now() })
  );

  const dismiss = () => {
    setDismissal({ modifiedAt, dismissedAt: Date.now() });
    setIsVisible(false);
  };

  return { isVisible, dismiss };
}
