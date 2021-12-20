import {useEffect, useState} from 'react';
import {FicheActionRead} from 'generated/dataLayer/fiche_action_read';
import {ficheActionReadEndpoint} from 'core-logic/api/endpoints/FicheActionReadEndpoint';
import {ficheActionWriteEndpoint} from 'core-logic/api/endpoints/FicheActionWriteEndpoint';
import {ficheActionRepository} from 'core-logic/api/repositories/FicheActionRepository';

export const useFicheActionList = (collectiviteId: number) => {
  const [fiches, setFiches] = useState<FicheActionRead[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const fiches =
        await ficheActionRepository.fetchCollectiviteFicheActionList({
          collectiviteId: collectiviteId,
        });
      setFiches(fiches);
    };
    ficheActionWriteEndpoint.addListener(fetch);
    fetch();
    return () => {
      ficheActionWriteEndpoint.removeListener(fetch);
    };
  });

  return fiches;
};

export const useFicheAction = (collectiviteId: number, uid: string) => {
  const [fiche, setFiche] = useState<FicheActionRead | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const fiche = await ficheActionRepository.fetchFicheAction({
        collectiviteId: collectiviteId,
        ficheActionUid: uid,
      });
      setFiche(fiche);
    };
    ficheActionWriteEndpoint.addListener(fetch);
    fetch();
    return () => {
      ficheActionWriteEndpoint.removeListener(fetch);
    };
  });

  return fiche;
};
