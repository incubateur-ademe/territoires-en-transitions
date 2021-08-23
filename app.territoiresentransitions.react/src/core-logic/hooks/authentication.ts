import {useEffect, useState} from 'react';
import {UtilisateurDroits} from 'generated/models/utilisateur_droits';
import {auth, currentUtilisateurDroits} from 'core-logic/api/authentication';
import {UtilisateurConnecteStorable} from 'storables/UtilisateurConnecteStorable';
import {utilisateurConnecteStore} from 'core-logic/api/localStore';

export function useDroits(): UtilisateurDroits[] {
  const [droits, setDroits] = useState<UtilisateurDroits[]>([]);

  useEffect(() => {
    const listener = async () => {
      const droitsJson = droits.map(d => JSON.stringify(d));
      const currentJson = auth.currentUtilisateurDroits!.map(d =>
        JSON.stringify(d)
      );
      if (!currentJson.every(s => droitsJson.includes(s))) {
        console.log(currentJson, droitsJson);
        setDroits(auth.currentUtilisateurDroits!);
      }
    };
    currentUtilisateurDroits();

    auth.addListener(listener);
    return () => {
      auth.removeListener(listener);
    };
  });

  return droits;
}

export const useUser = (): UtilisateurConnecteStorable | null => {
  const [user, setUser] = useState<UtilisateurConnecteStorable | null>(null);

  useEffect(() => {
    const listener = async () => {
      const storable = await utilisateurConnecteStore.retrieveById(
        UtilisateurConnecteStorable.id
      );
      setUser(storable);
    };

    try {
      const retrieved = utilisateurConnecteStore.retrieveById(
        UtilisateurConnecteStorable.id
      );
      if (retrieved.ademe_user_id !== user?.ademe_user_id) setUser(retrieved);
    } catch (_) {
      setUser(null);
    }

    utilisateurConnecteStore.addListener(listener);
    return () => {
      utilisateurConnecteStore.removeListener(listener);
    };
  }, [user]);

  return user;
};

export const useConnected = (): boolean => {
  return useUser() !== null;
};
