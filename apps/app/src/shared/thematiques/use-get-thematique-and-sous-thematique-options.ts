import { Option } from '@tet/ui';
import { useEffect, useMemo } from 'react';

import { useListSousThematiques } from '@/app/shared/thematiques/use-list-sous-thematiques';

import { useListThematiques } from '@/app/shared/thematiques/use-list-thematiques';

import { SousThematique, Thematique } from '@tet/domain/shared';

export const useGetThematiqueOptions = (): {
  thematiqueOptions: Array<Option>;
  thematiqueListe: Thematique[];
} => {
  const { data: thematiqueListe = [] } = useListThematiques();
  return {
    thematiqueOptions: thematiqueListe.map((thematique) => ({
      value: thematique.id,
      label: thematique.nom,
    })),
    thematiqueListe,
  };
};

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
  const { thematiqueListe, thematiqueOptions } = useGetThematiqueOptions();
  const { data: sousThematiqueListe = [] } = useListSousThematiques();

  const availableSousThematiques: SousThematique[] = useMemo(() => {
    const thematiqueIds = new Set(selectedThematiques.map(({ id }) => id));
    return sousThematiqueListe.filter(({ thematiqueId }) =>
      thematiqueIds.has(thematiqueId)
    );
  }, [sousThematiqueListe, selectedThematiques]);

  const sousThematiqueOptions = useMemo(
    () =>
      availableSousThematiques.map(({ id, nom }) => ({
        value: id,
        label: nom,
      })),
    [availableSousThematiques]
  );

  useEffect(() => {
    const selectedIds = new Set(selectedSousThematiques.map(({ id }) => id));
    const updatedSousThematiques = availableSousThematiques.filter(({ id }) =>
      selectedIds.has(id)
    );

    if (updatedSousThematiques.length !== selectedSousThematiques.length) {
      onThematiqueChange(updatedSousThematiques);
    }
  }, [availableSousThematiques, onThematiqueChange, selectedSousThematiques]);

  return {
    sousThematiqueOptions,
    thematiqueOptions,
    thematiqueListe,
    sousThematiqueListe,
  };
};
