import useLocalStorage from 'react-use/lib/useLocalStorage';

const STORAGE_KEY = 'tet_reprise_tec_panneau';

export const usePanneauTerritoire = () => {
  const [stored, setStored] = useLocalStorage<'ouvert' | 'ferme'>(
    STORAGE_KEY,
    'ouvert'
  );
  const ouvert = stored !== 'ferme';
  return [ouvert, () => setStored(ouvert ? 'ferme' : 'ouvert')] as const;
};
