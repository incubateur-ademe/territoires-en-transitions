import { useSousThematiqueListe } from '@/app/ui/dropdownLists/SousThematiquesDropdown/useSousThematiqueListe';
import { useThematiqueListe } from '@/app/ui/dropdownLists/ThematiquesDropdown/useThematiqueListe';
import { SousThematique, Thematique } from '@/domain/shared';
import { Option } from '@/ui/design-system/Select/utils';
import { useEffect, useMemo } from 'react';

export const useGetThematiqueAndSousThematiqueOptions = ({
  selectedThematiques,
  selectedSousThematiques,
  onThematiqueChange,
}: {
  selectedThematiques: Thematique[];
  selectedSousThematiques: SousThematique[];
  onThematiqueChange: (updatedSousThematiques: SousThematique[]) => void;
}): {
  thematiqueOptions: Array<Option>;
  sousThematiqueOptions: Array<Option>;
  thematiqueListe: Thematique[];
  sousThematiqueListe: SousThematique[];
} => {
  const thematiqueListe = useThematiqueListe();
  const sousThematiqueListe = useSousThematiqueListe();
  const thematiqueOptions = thematiqueListe.map((thematique) => ({
    value: thematique.id,
    label: thematique.nom,
  }));

  const availableSousThematiques: SousThematique[] = useMemo(
    () =>
      sousThematiqueListe.filter(({ thematiqueId }) => {
        return selectedThematiques.some(({ id }) => id === thematiqueId);
      }),
    [sousThematiqueListe, selectedThematiques]
  );
  const sousThematiqueOptions = useMemo(
    () =>
      availableSousThematiques.map(({ id, nom }) => ({
        value: id,
        label: nom,
      })),
    [availableSousThematiques]
  );

  useEffect(() => {
    const updatedSousThematiques = availableSousThematiques.filter(({ id }) =>
      selectedSousThematiques.some(({ id: selectedId }) => selectedId === id)
    );

    if (updatedSousThematiques.length !== selectedSousThematiques.length) {
      onThematiqueChange(updatedSousThematiques);
    }
  }, [
    availableSousThematiques,
    onThematiqueChange,
    selectedSousThematiques,
    sousThematiqueListe,
    sousThematiqueOptions,
  ]);

  return {
    sousThematiqueOptions,
    thematiqueOptions,
    thematiqueListe,
    sousThematiqueListe,
  };
};
