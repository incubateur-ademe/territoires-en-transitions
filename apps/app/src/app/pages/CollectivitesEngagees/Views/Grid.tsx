import { appLabels } from '@/app/labels/catalog';
import { Data } from '@/app/app/pages/CollectivitesEngagees/Views/View';
import { RecherchesViewParam } from '@/app/app/paths';
import noResultIllustration from '@/app/app/static/img/no-results-astronaut-bro.svg?url';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import Image from 'next/image';
import { JSX } from 'react';

type Props<T extends Data> = {
  view: RecherchesViewParam;
  isLoading?: boolean;
  data: T[];
  renderCard: (data: T) => JSX.Element;
};

export const Grid = <T extends Data>({
  view,
  isLoading,
  data,
  renderCard,
}: Props<T>) => {
  const viewToText: Record<RecherchesViewParam, string> = {
    collectivites: appLabels.rechercheGridAucuneCollectivite,
    referentiels: appLabels.rechercheGridAucunReferentiel,
    plans: appLabels.rechercheGridAucunPlan,
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="flex h-[32rem]">
        <SpinnerLoader className="m-auto" />
      </div>
    );
  }

  return (
    <>
      {/** Sans résultat */}
      {data.length === 0 ? (
        <div className="mt-10 md:mt-32 text-center text-primary-7">
          <div className="mb-4 text-2xl font-bold">
            {appLabels.oupsAucunResultat} {viewToText[view]}{' '}
            {appLabels.neCorrespondAVotreRecherche}
          </div>
          <div className="text-xl">
            {appLabels.modifierFiltresPourPlusDeResultats}
          </div>
          <Image
            className="w-[24rem] self-center mt-10"
            src={noResultIllustration}
            width={384}
            height={384}
            alt=""
          />
        </div>
      ) : (
        // Grille des cartes
        <div>
          <div className="grid xl:grid-cols-2 gap-6">
            {data.map(renderCard)}
          </div>
        </div>
      )}
    </>
  );
};
