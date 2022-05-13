import {supabaseClient} from 'core-logic/api/supabase';
import {ActionStatutsRead} from 'generated/dataLayer/action_statuts_read';
import {useEffect, useState} from 'react';

// nombre de total de taches (entrées n'ayant pas d'enfants) dans un référentiel
export const useTotalTachesCount = async (referentiel: string) => {
  const [total, setTotal] = useState(0);

  const fetch = async () => {
    const {error, count} = await supabaseClient
      .from<ActionStatutsRead>('action_statuts')
      .select('identifiant', {count: 'exact', head: true})
      .eq('collectivite_id', 1)
      .eq('referentiel', referentiel)
      .eq('have_children', false)
      .limit(1);
    if (!error && count !== null) {
      setTotal(count);
    }
  };

  useEffect(() => {
    fetch();
  }, [referentiel]);

  return total;
};
