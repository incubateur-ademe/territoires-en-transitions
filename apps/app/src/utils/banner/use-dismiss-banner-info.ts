import useLocalStorage from 'react-use/lib/useLocalStorage';

const STORAGE_KEY = 'tet_banner_info_dismissal';

export function useDismissBannerInfo(messageVersion: string): {
  isVisible: boolean;
  dismiss: () => void;
} {
  const [dismissedMessageVersion, setDismissedMessageVersion] =
    useLocalStorage<string>(STORAGE_KEY, undefined, { raw: true });

  return {
    isVisible: dismissedMessageVersion !== messageVersion,
    dismiss: () => setDismissedMessageVersion(messageVersion),
  };
}
