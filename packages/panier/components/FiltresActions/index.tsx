'use client';

import {useEffect, useState} from 'react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {
  ActionImpactFourchetteBudgetaire,
  ActionImpactTempsMiseEnOeuvre,
  ActionImpactThematique,
} from '@tet/api';
import {BadgesFilters, OptionValue, useEventTracker} from '@tet/ui';
import {usePanierContext} from 'providers';

type FiltresActionsProps = {
  budgets: ActionImpactFourchetteBudgetaire[];
  temps: ActionImpactTempsMiseEnOeuvre[];
  thematiques: ActionImpactThematique[];
};

const FiltresActions = ({budgets, temps, thematiques}: FiltresActionsProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tracker = useEventTracker('panier/panier');
  const {panier} = usePanierContext();

  const [thematiquesValues, setThematiquesValues] = useState<
    OptionValue[] | undefined
  >();
  const [budgetsValues, setBudgetsValues] = useState<
    OptionValue[] | undefined
  >();
  const [tempsValues, setTempsValues] = useState<OptionValue[] | undefined>();

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
    const tempsParams = searchParams
      .get('m')
      ?.split(',')
      .map(val => parseInt(val));
    // const competencesParams = searchParams.get('c');

    if (!!thematiquesParams) setThematiquesValues(thematiquesParams);
    if (!!budgetsParams) setBudgetsValues(budgetsParams);
    if (!!tempsParams) setTempsValues(tempsParams);

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
    if (!!tempsValues && tempsValues?.length > 0) {
      paramsArray.push(`m=${tempsValues.join(',')}`);
    }

    const href =
      paramsArray.length > 0
        ? `${pathname}?${paramsArray.join('&')}`
        : pathname;

    const trackThenNavigate = async () => {
      await tracker('filtre', {
        collectivite_preset: panier?.collectivite_preset ?? null,
        panier_id: panier?.id ?? '',
        thematique_ids: thematiquesValues,
        niveau_budget_ids: budgetsValues,
        niveau_temps_ids: tempsValues,
      });
      router.push(href, {scroll: false});
    };

    trackThenNavigate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thematiquesValues?.length, budgetsValues?.length, tempsValues?.length]);

  return (
    <BadgesFilters
      filters={[
        {
          title: 'Thématiques',
          options: thematiques.map(t => ({value: t.id, label: t.nom})),
          values: thematiquesValues,
          onChange: ({values}) => setThematiquesValues(values),
          multiple: true,
        },
        {
          title: 'Ordre de grandeur budgétaire',
          tag: 'Budget',
          options: budgets.map(b => ({value: b.niveau, label: b.nom})),
          values: budgetsValues,
          onChange: ({values}) => setBudgetsValues(values),
          multiple: true,
        },
        {
          title: 'Temps de mise en oeuvre',
          tag: 'Durée',
          options: temps.map(t => ({value: t.niveau, label: t.nom})),
          values: tempsValues,
          onChange: ({values}) => setTempsValues(values),
          multiple: true,
        },
      ]}
      className="my-4"
      btnMenuClassName="-mt-14"
      notificationBtnClassName="-mt-14"
    />
  );
};

export default FiltresActions;
