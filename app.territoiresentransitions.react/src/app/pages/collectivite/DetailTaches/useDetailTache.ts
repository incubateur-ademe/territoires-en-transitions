import {supabaseClient} from 'core-logic/api/supabase';
import {IActionStatutsRead} from 'generated/dataLayer/action_statuts_read';
import {useEffect, useState} from 'react';

// un sous-ensemble des champs pour alimenter notre table des taches
export type TacheDetail = Pick<
  IActionStatutsRead,
  'action_id' | 'identifiant' | 'nom' | 'avancement' | 'have_children' | 'depth'
>;

// malheureusement il n'existe pas (à notre connaissance) de moyens simples de
// faire la conversion typage <-> js il faut donc dupliquer la liste des
// colonnes voulues
// Ref: https://stackoverflow.com/questions/43909566/get-keys-of-a-typescript-interface-as-array-of-strings
const COLUMNS = 'action_id,identifiant,nom,avancement,have_children,depth';

// toutes les entrées d'un référentiel à une certaine profondeur et pour une
// collectivité donnée
export const useDetailTachesList = (
  collectivite_id: number,
  referentiel: string,
  depth: number
) => {
  const [data, setData] = useState<null | TacheDetail[]>(null);

  const fetch = async () => {
    const {error, data} = await supabaseClient
      .from<IActionStatutsRead>('action_statuts')
      .select(COLUMNS)
      .eq('collectivite_id', collectivite_id)
      .eq('referentiel', referentiel)
      .eq('depth', depth)
      .order('identifiant', {ascending: true});
    if (!error && data) {
      setData(data);
    }
  };

  useEffect(() => {
    fetch();
  }, [collectivite_id, referentiel, depth]);

  return data;
};

// le détail d'une tâche du référentiel pour une collectivité donnée
export const useDetailTache = (
  collectivite_id: number,
  referentiel: string,
  action_id: number
) => {
  const [data, setData] = useState<null | TacheDetail>(null);

  const fetch = async () => {
    const {error, data} = await supabaseClient
      .from<IActionStatutsRead>('action_statuts')
      .select(COLUMNS)
      .eq('collectivite_id', collectivite_id)
      .eq('referentiel', referentiel)
      .eq('action_id', action_id);
    if (!error && data?.length) {
      setData(data[0]);
    }
  };

  useEffect(() => {
    fetch();
  }, [collectivite_id, referentiel, action_id]);

  return data;
};
