import useLocalStorage from 'react-use/lib/useLocalStorage';

export type BackofficeDisplay = 'grille' | 'liste';

const STORAGE_KEY = 'tet_backoffice_display';

export const useBackofficeDisplay = () => {
  const [stored, setStored] = useLocalStorage<BackofficeDisplay>(
    STORAGE_KEY,
    'grille'
  );

  return [stored ?? 'grille', setStored] as const;
};
