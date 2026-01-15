import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { useListFinanceurs } from '@/app/collectivites/tags/use-list-financeurs';
import { useListInstanceGouvernances } from '@/app/collectivites/tags/use-list-instance-gouvernances';
import { useListLibreTags } from '@/app/collectivites/tags/use-list-libre-tags';
import { useListPartenaires } from '@/app/collectivites/tags/use-list-partenaires';
import { usePersonneListe } from '@/app/collectivites/tags/use-list-personnes';
import { useListServices } from '@/app/collectivites/tags/use-list-services';
import { useListStructures } from '@/app/collectivites/tags/use-list-structures';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { useGetThematiqueOptions } from '@/app/ui/dropdownLists/ThematiquesDropdown/use-get-thematique-and-sous-thematique-options';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useMemo } from 'react';
import { NOTES_OPTIONS } from './options';
import { FilterKeys } from './types';

export type LookupConfig = {
  items: any[] | undefined;
  key: string;
  valueKey: string;
  fallbackLabel?: string;
};

export const useFicheActionFiltersData = () => {
  const collectiviteId = useCollectiviteId();

  const { data: personnes } = usePersonneListe();
  const { plans } = useListPlans(collectiviteId);
  const { data: services } = useListServices();
  const { thematiqueListe } = useGetThematiqueOptions();
  const { data: financeurs } = useListFinanceurs();
  const { data: structures } = useListStructures();
  const { data: partenaires } = useListPartenaires();
  const { data: tags } = useListLibreTags();
  const { data: instanceGouvernanceTags } = useListInstanceGouvernances();

  const personneOptions = useMemo(() => {
    return (
      personnes?.map((personne) => ({
        value: getPersonneStringId(personne),
        label: personne.nom,
      })) ?? []
    );
  }, [personnes]);

  const lookupConfig: Partial<Record<FilterKeys, LookupConfig>> = useMemo(
    () => ({
      planActionIds: {
        items: plans,
        key: 'id',
        valueKey: 'nom',
        fallbackLabel: 'Sans titre',
      },
      utilisateurPiloteIds: {
        items: personneOptions,
        key: 'value',
        valueKey: 'label',
      },
      utilisateurReferentIds: {
        items: personneOptions,
        key: 'value',
        valueKey: 'label',
      },
      personnePiloteIds: {
        items: personneOptions,
        key: 'value',
        valueKey: 'label',
      },
      personneReferenteIds: {
        items: personneOptions,
        key: 'value',
        valueKey: 'label',
      },
      servicePiloteIds: {
        items: services,
        key: 'id',
        valueKey: 'nom',
      },
      thematiqueIds: {
        items: thematiqueListe,
        key: 'id',
        valueKey: 'nom',
      },
      financeurIds: {
        items: financeurs,
        key: 'id',
        valueKey: 'nom',
      },
      structurePiloteIds: {
        items: structures,
        key: 'id',
        valueKey: 'nom',
      },
      partenaireIds: {
        items: partenaires,
        key: 'id',
        valueKey: 'nom',
      },
      libreTagsIds: {
        items: tags,
        key: 'id',
        valueKey: 'nom',
      },
      instanceGouvernanceIds: {
        items: instanceGouvernanceTags,
        key: 'id',
        valueKey: 'nom',
      },
      notes: {
        items: NOTES_OPTIONS,
        key: 'value',
        valueKey: 'label',
      },
    }),
    [
      plans,
      personneOptions,
      services,
      thematiqueListe,
      financeurs,
      structures,
      partenaires,
      tags,
      instanceGouvernanceTags,
    ]
  );

  return {
    lookupConfig,
  };
};
