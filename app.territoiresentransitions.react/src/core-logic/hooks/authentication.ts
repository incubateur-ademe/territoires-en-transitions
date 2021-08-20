import {useEffect, useState} from 'react';
import {UtilisateurDroits} from 'generated/models/utilisateur_droits';
import {auth, currentUtilisateurDroits} from 'core-logic/api/authentication';

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
