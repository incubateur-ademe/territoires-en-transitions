'use client';

import { getAuthPaths, PanierAPI, useSupabase } from '@/api';
import { Button, Event, Icon, useEventTracker } from '@/ui';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUserContext } from '../../providers';
import SelectCollectivite from './SelectCollectivite';
import { useCollectiviteInfo } from './useCollectiviteInfo';

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

  const tracker = useEventTracker();
  const supabase = useSupabase();

  const onClick = async () => {
    const base = await new PanierAPI(supabase).panierFromLanding(
      collectiviteId
    );
    tracker(Event.panier.ctaPanierClick, {
      collectivite_preset: collectiviteId,
      collectiviteId,
    });
    router.push(`/panier/${base.id}`);
  };

  // récupère les urls du module auth.
  let authPaths;
  if (typeof window !== 'undefined') {
    const redirectTo = new URL(document.location.href);
    redirectTo.pathname = `/landing/collectivite/${collectiviteId}`;
    authPaths = getAuthPaths(redirectTo.toString());
  }

  const nonRattache =
    collectiviteInfo?.active && !collectiviteInfo.isOwnCollectivite;
  const nonConnecte = !user;

  return (
    <>
      <div className="flex flex-row gap-4 w-full">
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
                  Vous êtes membre d&apos;une collectivité déjà engagée dans le
                  programme Territoire Engagé Transition Écologique ?
                </span>
                <br />
                Le panier d&apos;actions basé principalement sur les actions des
                référentiels est conçu en priorité pour faciliter le passage à
                l&apos;action aux collectivités qui ne sont pas encore engagées
                !
              </p>
            </div>
          )}
        </div>
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
