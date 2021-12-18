import {useEffect, useState} from 'react';
import {FicheActionRead} from 'generated/dataLayer/fiche_action_read';
import {ficheActionReadEndpoint} from 'core-logic/api/endpoints/FicheActionReadEndpoint';
import {ficheActionWriteEndpoint} from 'core-logic/api/endpoints/FicheActionWriteEndpoint';

export const useFicheActionList = (collectiviteId: number) => {
  const [fiches, setFiches] = useState<FicheActionRead[]>([]);

  useEffect(() => {
    const listener = async () => {
      const fiches = await ficheActionReadEndpoint.getBy({
        collectivite_id: collectiviteId,
      });
      setFiches(fiches);
    };
    ficheActionWriteEndpoint.addListener(listener);
    return () => {
      ficheActionWriteEndpoint.removeListener(listener);
    };
  });

  return fiches;
};

export const useFicheAction = (collectiviteId: number, uid: string) => {
  const [fiche, setFiche] = useState<FicheActionRead | null>(null);

  useEffect(() => {
    const listener = async () => {
      const fiches = await ficheActionReadEndpoint.getBy({
        collectivite_id: collectiviteId,
        fiche_action_uid: uid,
      });
      if (fiches.length === 0) {
        setFiche(null);
      } else {
        setFiche(fiches[0]!);
      }
    };
    ficheActionWriteEndpoint.addListener(listener);
    return () => {
      ficheActionWriteEndpoint.removeListener(listener);
    };
  });

  return fiche;
};
