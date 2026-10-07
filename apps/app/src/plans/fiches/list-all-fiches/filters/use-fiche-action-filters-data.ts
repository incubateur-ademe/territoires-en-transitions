import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { useListFinanceurs } from '@/app/collectivites/tags/use-list-financeurs';
import { useListInstanceGouvernances } from '@/app/collectivites/tags/use-list-instance-gouvernances';
import { useListLibreTags } from '@/app/collectivites/tags/use-list-libre-tags';
import { useListPartenaires } from '@/app/collectivites/tags/use-list-partenaires';
import { usePersonneListe } from '@/app/collectivites/tags/use-list-personnes';
import { useListServices } from '@/app/collectivites/tags/use-list-services';
import { useListStructures } from '@/app/collectivites/tags/use-list-structures';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { useGetThematiqueOptions } from '@/app/shared/thematiques/use-get-thematique-and-sous-thematique-options';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useMemo } from 'react';
import { buildLookupConfig } from './build-lookup-config';

export type { LookupConfig } from './build-lookup-config';

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

  const lookupConfig = useMemo(
    () =>
      buildLookupConfig({
        plans,
        personneOptions,
        services,
        thematiques: thematiqueListe,
        financeurs,
        structures,
        partenaires,
        libreTags: tags,
        instanceGouvernanceTags,
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
