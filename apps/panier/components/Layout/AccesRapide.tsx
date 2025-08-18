// TODO : changer ce systèle car chein relatif à l'app
import { ENV } from '@/api/environmentVariables';
import { useCollectiviteInfo } from '@/panier/components/Landing/useCollectiviteInfo';
import { usePanierContext } from '@/panier/providers';
import { Button, SITE_BASE_URL } from '@/ui';
import { HeaderPropsWithModalState } from '@/ui/design-system/Header/header-with-nav/types';

/** liens en "accès rapide" */
export const AccesRapide = (props: HeaderPropsWithModalState) => {
  const { panier } = usePanierContext();
  const { data: collectiviteInfo } = useCollectiviteInfo(
    panier?.collectivite_id ?? panier?.collectivite_preset ?? null
  );

  return (
    <ul className="max-lg:hidden list-none flex items-center gap-2 divide-x divide-x-grey-4 mb-0">
      <li className="pl-2 first-of-type:pl-0 pb-0 flex items-center">
        <Button
          key="outil"
          href={`${SITE_BASE_URL}/outil-numerique`}
          variant="white"
          external
          title="Qui sommes-nous ?"
          iconPosition="left"
        >
          Qui sommes-nous ?
        </Button>
      </li>

      {collectiviteInfo && collectiviteInfo.isOwnCollectivite && (
        <li className="pl-2 flex items-center">
          <Button
            key="nom"
            variant="white"
            href={`${ENV.app_url}/collectivite/${collectiviteInfo.collectivite_id}/accueil`}
            title={`Accéder à ${collectiviteInfo.nom}`}
            aria-label={`Accéder à votre collectivité ${collectiviteInfo.nom}`}
          >
            {collectiviteInfo.nom}
          </Button>
        </li>
      )}

      {collectiviteInfo && !collectiviteInfo.isOwnCollectivite && (
        <li className="pl-2 first-of-type:pl-0 pb-0 flex items-center">
          <span
            className="relative w-fit flex items-center border-solid gap-2 cursor-default border rounded-lg border-white bg-white text-primary font-bold px-4 py-2"
            aria-label={`Collectivité actuelle : ${collectiviteInfo.nom}`}
            role="status"
          >
            {collectiviteInfo.nom}
          </span>
        </li>
      )}
    </ul>
  );
};
