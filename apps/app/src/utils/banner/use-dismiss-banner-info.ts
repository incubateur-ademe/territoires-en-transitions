import useLocalStorage from 'react-use/lib/useLocalStorage';

const STORAGE_KEY = 'tet_banner_info_dismissal';

export function useDismissBannerInfo(modifiedAt: string): {
  isVisible: boolean;
  dismiss: () => void;
} {
  const [dismissedModifiedAt, setDismissedModifiedAt] = useLocalStorage<string>(
    STORAGE_KEY,
    undefined,
    { raw: true }
  );

  return {
    isVisible: dismissedModifiedAt !== modifiedAt,
    dismiss: () => setDismissedModifiedAt(modifiedAt),
  };
}
