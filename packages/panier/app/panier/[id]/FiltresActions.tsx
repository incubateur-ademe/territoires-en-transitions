'use client';

import {useContext, useEffect, useState} from 'react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {ActionImpactThematique} from '@tet/api';
import {Field, OptionValue, SelectMultiple} from '@tet/ui';
import {useEventTracker} from 'src/tracking/useEventTracker';
import {PanierContext} from 'app/panier/[id]/PanierRealtime';

type FiltresActionsProps = {
  budgets: {niveau: number; nom: string}[];
  thematiques: ActionImpactThematique[];
};

const FiltresActions = ({budgets, thematiques}: FiltresActionsProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tracker = useEventTracker('panier');
  const panier = useContext(PanierContext);

  const [complexiteValues, setComplexiteValues] = useState<
    OptionValue[] | undefined
  >();
  const [thematiquesValues, setThematiquesValues] = useState<
    OptionValue[] | undefined
  >();
  const [budgetsValues, setBudgetsValues] = useState<
    OptionValue[] | undefined
  >();

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

    if (!!thematiquesParams) setThematiquesValues(thematiquesParams);
    if (!!budgetsParams) setBudgetsValues(budgetsParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let paramsArray = [];

    if (!!thematiquesValues && thematiquesValues?.length > 0) {
      paramsArray.push(`t=${thematiquesValues.join(',')}`);
    }
    if (!!budgetsValues && budgetsValues?.length > 0) {
      paramsArray.push(`b=${budgetsValues.join(',')}`);
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
      });
      router.push(href);
    };
    trackThenNavigate();
  }, [
    thematiquesValues,
    thematiquesValues?.length,
    budgetsValues,
    budgetsValues?.length,
    router,
    pathname,
    panier,
    tracker,
  ]);

  return (
    <div className="mb-12 grid grid-cols-3 gap-4 relative z-10 bg-white p-6 rounded-lg">
      <Field title="Niveau de complexité">
        <SelectMultiple
          options={[]}
          values={complexiteValues}
          onChange={({values}) => {
            setComplexiteValues(values);
          }}
          isBadgeItem={true}
          disabled
        />
      </Field>
      <Field title="Thématiques">
        <SelectMultiple
          options={thematiques.map(t => ({value: t.id, label: t.nom}))}
          values={thematiquesValues}
          onChange={({values}) => {
            setThematiquesValues(values);
          }}
          isBadgeItem={true}
        />
      </Field>
      <Field title="Ordre de grandeur budgétaire">
        <SelectMultiple
          options={budgets.map(b => ({value: b.niveau, label: b.nom}))}
          values={budgetsValues}
          onChange={({values}) => {
            setBudgetsValues(values);
          }}
          isBadgeItem={true}
        />
      </Field>
    </div>
  );
};

export default FiltresActions;
