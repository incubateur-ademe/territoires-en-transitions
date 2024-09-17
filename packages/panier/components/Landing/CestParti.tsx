'use client';

import {useState} from 'react';
import {panierAPI} from '@tet/panier/src/clientAPI';
import {useParams, usePathname, useRouter} from 'next/navigation';
import {useEventTracker, Button, Icon} from '@tet/ui';
import SelectCollectivite from './SelectCollectivite';
import {useCollectiviteInfo} from './useCollectiviteInfo';

const CestParti = () => {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const pathnameArray = pathname.split('/');
  const id = params['id'];
  const collectiviteIdFromUrl = pathnameArray[2] === 'collectivite' && id;
  const [collectiviteId, setCollectiviteId] = useState(
    collectiviteIdFromUrl ? parseInt(id as string) : null,
  );
  const {data: collectiviteInfo} = useCollectiviteInfo(collectiviteId);

  const tracker = useEventTracker(
    collectiviteId ? 'panier/landing/collectivite' : 'panier/landing',
  );

  const onClick = async () => {
    const base = await panierAPI.panierFromLanding(collectiviteId);
    collectiviteId
      ? tracker('cta_panier_click', {collectivite_preset: collectiviteId})
      : // @ts-expect-error
        tracker('cta_panier_click');
    router.push(`/panier/${base.id}`);
  };

  return (
    <div className="flex flex-row gap-4 w-full">
      {!collectiviteIdFromUrl && (
        <div className="w-full">
          <SelectCollectivite
            collectiviteId={collectiviteId}
            onSelectCollectivite={setCollectiviteId}
          />
          {collectiviteInfo?.engagee && (
            <div className="flex flex-row mt-4 gap-2">
              <Icon icon="alert-fill text-warning-1" />
              <p className="text-xs">
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
      )}
      <Button
        className="min-w-max h-12"
        disabled={!collectiviteId}
        onClick={onClick}
      >
        C&apos;est parti !
      </Button>
    </div>
  );
};

export default CestParti;
