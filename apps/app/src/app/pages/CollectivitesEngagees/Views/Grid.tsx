import { Data } from '@/app/app/pages/CollectivitesEngagees/Views/View';
import { RecherchesViewParam } from '@/app/app/paths';
import noResultIllustration from '@/app/app/static/img/no-results-astronaut-bro.svg?url';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import Image from 'next/image';

type Props = {
  view: RecherchesViewParam;
  isLoading?: boolean;
  isConected?: boolean;
  data: Data[];
  renderCard: (data: Data) => JSX.Element;
};

export const Grid = ({
  view,
  isLoading,
  isConected,
  data,
  renderCard,
}: Props) => {
  const viewToText: Record<RecherchesViewParam, string> = {
    collectivites: 'aucune collectivité',
    referentiels: 'aucun référentiel',
    plans: 'aucun plan',
  };

  // Non connecté
  if (view === 'plans' && !isConected) {
    return (
      <div className="mt-10 md:mt-32 text-center text-primary-7">
        <div className="mb-4 text-2xl font-bold">
          {"Oups... vous n'avez pas accès à ces données !"}
        </div>
        <div className="text-xl">Connectez-vous pour accéder à cette page.</div>
      </div>
    );
  }

  // État de chargement
  if (isLoading) {
    return (
      <div className="flex h-96 text-center text-grey-6">
        <div className="m-auto">
          <SpinnerLoader className="m-auto fill-grey-8 w-8 h-8" />
          <div className="mt-8">Chargement en cours...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/** Sans résultat */}
      {data.length === 0 ? (
        <div className="mt-10 md:mt-32 text-center text-primary-7">
          <div className="mb-4 text-2xl font-bold">
            Oups... {viewToText[view]} ne correspond à votre recherche !
          </div>
          <div className="text-xl">
            Modifiez ou désactivez les filtres pour obtenir plus de résultats
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
        (<div>
          <div className="grid xl:grid-cols-2 gap-6">
            {data.map((data) => renderCard(data))}
          </div>
        </div>)
      )}
    </>
  );
};
