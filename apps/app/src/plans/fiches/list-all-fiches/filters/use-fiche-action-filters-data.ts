import { usePlansActionsListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import { useFinanceursListe } from '@/app/ui/dropdownLists/FinanceursDropdown/useFinanceursListe';
import { usePartenairesListe } from '@/app/ui/dropdownLists/PartenairesDropdown/usePartenairesListe';
import { usePersonneListe } from '@/app/ui/dropdownLists/PersonnesDropdown/usePersonneListe';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import { useServicesPilotesListe } from '@/app/ui/dropdownLists/ServicesPilotesDropdown/useServicesPilotesListe';
import { useStructuresListe } from '@/app/ui/dropdownLists/StructuresDropdown/useStructuresListe';
import { useTagsSuiviPersoListe } from '@/app/ui/dropdownLists/TagsSuiviPersoDropdown/useTagsSuiviPersoListe';
import { useGetThematiqueOptions } from '@/app/ui/dropdownLists/ThematiquesDropdown/use-get-thematique-and-sous-thematique-options';
import { useMemo } from 'react';
import { FilterKeys } from './types';

export type LookupConfig = {
  items: any[] | undefined;
  key: string;
  valueKey: string;
  fallbackLabel?: string;
};
export const useFicheActionFiltersData = () => {
  const { data: personnes } = usePersonneListe();
  const { data: plans } = usePlansActionsListe({});
  const { data: services } = useServicesPilotesListe();
  const { thematiqueListe } = useGetThematiqueOptions();
  const { data: financeurs } = useFinanceursListe();
  const { data: structures } = useStructuresListe();
  const { data: partenaires } = usePartenairesListe();
  const { data: tags } = useTagsSuiviPersoListe();

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
        items: plans?.plans,
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
    }),
    [
      plans?.plans,
      personneOptions,
      services,
      thematiqueListe,
      financeurs,
      structures,
      partenaires,
      tags,
    ]
  );

  return {
    lookupConfig,
  };
};
