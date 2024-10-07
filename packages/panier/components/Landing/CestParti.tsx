'use client';

import {useState} from 'react';
import {panierAPI} from '@tet/panier/src/clientAPI';
import {useParams, usePathname, useRouter} from 'next/navigation';
import {useEventTracker, Button, Icon} from '@tet/ui';
import SelectCollectivite from './SelectCollectivite';
import {useCollectiviteInfo} from './useCollectiviteInfo';
import { getAuthPaths } from '@tet/api';
import { useUserContext } from '../../providers';

const CestParti = () => {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const pathnameArray = pathname.split('/');
  const id = params['id'];
  const collectiviteIdFromUrl = pathnameArray[2] === 'collectivite' && id;
  const [collectiviteId, setCollectiviteId] = useState(
    collectiviteIdFromUrl ? parseInt(id as string) : null
  );
  const { data: collectiviteInfo } = useCollectiviteInfo(collectiviteId);
  const { user } = useUserContext();

  const tracker = useEventTracker(
    collectiviteId ? 'panier/landing/collectivite' : 'panier/landing'
  );

  const onClick = async () => {
    const base = await panierAPI.panierFromLanding(collectiviteId);
    collectiviteId
      ? tracker('cta_panier_click', { collectivite_preset: collectiviteId })
      : // @ts-expect-error traque même si la collectivité n'est pas spécifiée
        tracker('cta_panier_click');
    router.push(`/panier/${base.id}`);
  };

  // récupère les urls du module auth.
  let authPaths;
  if (typeof window !== 'undefined') {
    const redirectTo = new URL(document.location.href);
    redirectTo.pathname = `/landing/collectivite/${collectiviteId}`;
    authPaths = getAuthPaths(document.location.hostname, redirectTo.toString());
  }

  const nonRattache =
    collectiviteInfo?.active && !collectiviteInfo.isOwnCollectivite;
  const nonConnecte = !user;

  return (
    <>
      <div className="flex flex-row gap-4 w-full">
        {(!collectiviteId || (nonRattache && !nonConnecte)) && (
          <div className="w-full">
            <SelectCollectivite
              collectiviteId={collectiviteId}
              onSelectCollectivite={setCollectiviteId}
            />
            {!collectiviteInfo?.active && collectiviteInfo?.engagee && (
              <div className="flex flex-row mt-4 gap-2">
                <Icon icon="alert-fill text-warning-1" />
                <p className="text-sm">
                  <span className="text-warning-1">
                    Vous êtes membre d&apos;une collectivité déjà engagée dans
                    le programme Territoire Engagé Transition Écologique ?
                  </span>
                  <br />
                  Le panier d&apos;actions basé principalement sur les actions
                  des référentiels est conçu en priorité pour faciliter le
                  passage à l&apos;action aux collectivités qui ne sont pas
                  encore engagées !
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      {nonRattache && (
        <>
          <div className="flex flex-row mt-4 gap-2">
            <Icon icon="alert-fill text-warning-1" />
            <p className="text-sm text-warning-1">
              {nonConnecte
                ? 'Connectez-vous ou créez un compte pour contribuer sur le panier de cette collectivité.'
                : "Vous n'êtes pas rattaché à cette collectivité."}
            </p>
          </div>
          {nonConnecte && authPaths && (
            <div className="flex gap-4 justify-center">
              <Button href={authPaths.login} variant="outlined">
                Se connecter
              </Button>
              <Button href={authPaths.signUp}>Créer un compte</Button>
            </div>
          )}
        </>
      )}
      <Button
        className="min-w-max h-12"
        disabled={!collectiviteId || !!nonRattache}
        onClick={onClick}
      >
        C&apos;est parti !
      </Button>
    </>
  );
};

export default CestParti;
