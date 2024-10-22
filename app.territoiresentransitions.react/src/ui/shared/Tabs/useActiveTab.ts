import { useRouter, useSearchParams } from 'next/navigation';

type TOptions = {
  paramName?: string;
  defaultActiveTab?: number;
};

/**
 * Permet de synchroniser l'index de l'onglet actif avec un paramètre de la
 * portion `search` (après le `?`) de l'url.
 * Par défaut l'onglet sélectionné est synchronisé avec le paramètre `v` et le
 * 1er onglet est sélectionné si la valeur n'est pas présente.
 */
export const useActiveTab = (options?: TOptions | undefined) => {
  const { paramName = 'v', defaultActiveTab = 0 } = options || {};
  const search = useSearchParams();
  const router = useRouter();
  const params = new URLSearchParams(search);
  const activeTab = parseInt(
    params.get(paramName) || defaultActiveTab.toString()
  );

  // synchronise l'url lors du passage d'un onglet à l'autre
  const onChangeTab = (index: number) => {
    // met à jour l'url
    if (index !== activeTab) {
      params.set(paramName, index.toString());
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

  return { activeTab, onChangeTab };
};
