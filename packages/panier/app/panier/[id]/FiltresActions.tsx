'use client';

import {useContext, useEffect, useState} from 'react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {
  ActionImpactFourchetteBudgetaire,
  ActionImpactTempsMiseEnOeuvre,
  ActionImpactThematique,
} from '@tet/api';
import {Field, OptionValue, SelectMultiple} from '@tet/ui';
import {useEventTracker} from '@tet/ui';
import {PanierContext} from 'app/panier/[id]/PanierRealtime';

type FiltresActionsProps = {
  budgets: ActionImpactFourchetteBudgetaire[];
  durees: ActionImpactTempsMiseEnOeuvre[];
  thematiques: ActionImpactThematique[];
};

const FiltresActions = ({
  budgets,
  durees,
  thematiques,
}: FiltresActionsProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tracker = useEventTracker('panier');
  const panier = useContext(PanierContext);

  const [thematiquesValues, setThematiquesValues] = useState<
    OptionValue[] | undefined
  >();
  const [budgetsValues, setBudgetsValues] = useState<
    OptionValue[] | undefined
  >();
  const [dureesValues, setDureesValues] = useState<OptionValue[] | undefined>();

  useEffect(() => {
    // Permet de conserver les filtres lors d'un changement d'onglet
    // ou au refresh de la page
    const thematiquesParams = searchParams
      .get('t')
      ?.split(',')
      .map(val => parseInt(val));
    const budgetsParams = searchParams
      .get('b')
      ?.split(',')
      .map(val => parseInt(val));
    const dureesParams = searchParams
      .get('d')
      ?.split(',')
      .map(val => parseInt(val));

    if (!!thematiquesParams) setThematiquesValues(thematiquesParams);
    if (!!budgetsParams) setBudgetsValues(budgetsParams);
    if (!!dureesParams) setDureesValues(dureesParams);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Mise à jour de l'url (et du panier) lorsqu'un filtre est modifié
    let paramsArray = [];

    if (!!thematiquesValues && thematiquesValues?.length > 0) {
      paramsArray.push(`t=${thematiquesValues.join(',')}`);
    }
    if (!!budgetsValues && budgetsValues?.length > 0) {
      paramsArray.push(`b=${budgetsValues.join(',')}`);
    }
    if (!!dureesValues && dureesValues?.length > 0) {
      paramsArray.push(`d=${dureesValues.join(',')}`);
    }

    const href =
      paramsArray.length > 0
        ? `${pathname}?${paramsArray.join('&')}`
        : pathname;

    const trackThenNavigate = async () => {
      await tracker('filtre', {
        collectivite_preset: panier.collectivite_preset,
        panier_id: panier.id,
        thematique_ids: thematiquesValues,
        niveau_budget_ids: budgetsValues,
        niveau_duree_ids: dureesValues,
      });
      router.push(href);
    };

    trackThenNavigate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thematiquesValues?.length, budgetsValues?.length, dureesValues?.length]);

  return (
    <div className="mb-8 grid sm:grid-cols-2 xl:grid-cols-3 gap-4 relative z-10 bg-white p-6 rounded-lg border-[0.5px] border-primary-3">
      <Field title="Thématiques">
        <SelectMultiple
          options={thematiques.map(t => ({value: t.id, label: t.nom}))}
          values={thematiquesValues}
          onChange={({values}) => {
            setThematiquesValues(values);
          }}
        />
      </Field>
      <Field title="Ordre de grandeur budgétaire">
        <SelectMultiple
          options={budgets.map(b => ({value: b.niveau, label: b.nom}))}
          values={budgetsValues}
          onChange={({values}) => {
            setBudgetsValues(values);
          }}
        />
      </Field>
      <Field title="Temps de mise en oeuvre">
        <SelectMultiple
          options={durees.map(b => ({value: b.niveau, label: b.nom}))}
          values={dureesValues}
          onChange={({values}) => {
            setDureesValues(values);
          }}
        />
      </Field>
    </div>
  );
};

export default FiltresActions;
