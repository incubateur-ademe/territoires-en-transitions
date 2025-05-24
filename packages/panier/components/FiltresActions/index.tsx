'use client';

import { usePanierContext } from '@/panier/providers';
import {
  Event,
  OptionValue,
  SelectMultipleOnChangeArgs,
  useEventTracker,
} from '@/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BadgesFilters } from './BadgesFilters';
import { ContenuListesFiltre } from './types';

type FiltresActionsProps = ContenuListesFiltre;

const FiltresActions = ({
  budgets,
  temps,
  thematiques,
  typologies,
}: FiltresActionsProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tracker = useEventTracker();
  const { panier } = usePanierContext();

  const [thematiquesValues, setThematiquesValues] = useState<
    OptionValue[] | undefined
  >();
  const [typologiesValues, setTypologiesValues] = useState<
    OptionValue[] | undefined
  >();
  const [budgetsValues, setBudgetsValues] = useState<
    OptionValue[] | undefined
  >();
  const [tempsValues, setTempsValues] = useState<OptionValue[] | undefined>();
  const [sansFiltreCompetencesValue, setSansFiltreCompetencesValue] =
    useState(false);

  useEffect(() => {
    // Permet de conserver les filtres lors d'un changement d'onglet
    // ou au refresh de la page
    const thematiquesParams = searchParams
      .get('t')
      ?.split(',')
      .map((val) => parseInt(val));
    const typologiesParams = searchParams
      .get('ty')
      ?.split(',')
      .map((val) => parseInt(val));
    const budgetsParams = searchParams
      .get('b')
      ?.split(',')
      .map((val) => parseInt(val));
    const tempsParams = searchParams
      .get('m')
      ?.split(',')
      .map((val) => parseInt(val));
    const competencesParams = searchParams.get('c');

    if (thematiquesParams) setThematiquesValues(thematiquesParams);
    if (typologiesParams) setTypologiesValues(typologiesParams);
    if (budgetsParams) setBudgetsValues(budgetsParams);
    if (tempsParams) setTempsValues(tempsParams);
    setSansFiltreCompetencesValue(competencesParams === 'true');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Mise à jour de l'url (et du panier) lorsqu'un filtre est modifié
    const paramsArray = [];

    if (!!thematiquesValues && thematiquesValues?.length > 0) {
      paramsArray.push(`t=${thematiquesValues.join(',')}`);
    }
    if (!!typologiesValues && typologiesValues?.length > 0) {
      paramsArray.push(`ty=${typologiesValues.join(',')}`);
    }
    if (!!budgetsValues && budgetsValues?.length > 0) {
      paramsArray.push(`b=${budgetsValues.join(',')}`);
    }
    if (!!tempsValues && tempsValues?.length > 0) {
      paramsArray.push(`m=${tempsValues.join(',')}`);
    }
    if (sansFiltreCompetencesValue) {
      paramsArray.push('c=true');
    }

    const href =
      paramsArray.length > 0
        ? `${pathname}?${paramsArray.join('&')}`
        : pathname;

    const trackThenNavigate = async () => {
      await tracker(Event.panier.filtre, {
        collectivite_preset: panier?.collectivite_preset ?? null,
        panier_id: panier?.id ?? '',
        thematique_ids: thematiquesValues,
        typologies_ids: typologiesValues,
        niveau_budget_ids: budgetsValues,
        niveau_temps_ids: tempsValues,
        match_competences: !sansFiltreCompetencesValue,
      });
      router.push(href, { scroll: false });
    };

    trackThenNavigate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    thematiquesValues?.length,
    typologiesValues?.length,
    budgetsValues?.length,
    tempsValues?.length,
    sansFiltreCompetencesValue,
  ]);

  return (
    <BadgesFilters
      filters={[
        {
          title: 'Thématiques',
          options: thematiques.map((t) => ({ value: t.id, label: t.nom })),
          values: thematiquesValues,
          onChange: (args) =>
            setThematiquesValues((args as SelectMultipleOnChangeArgs).values),
          multiple: true,
        },
        {
          title: 'Typologies',
          options: typologies.map((t) => ({ value: t.id, label: t.nom })),
          values: typologiesValues,
          onChange: ({ values }) => setTypologiesValues(values),
          multiple: true,
        },
        {
          title: 'Ordre de grandeur budgétaire',
          tag: 'Budget',
          options: budgets.map((b) => ({ value: b.niveau, label: b.nom })),
          values: budgetsValues,
          onChange: (args) =>
            setBudgetsValues((args as SelectMultipleOnChangeArgs).values),
          multiple: true,
        },
        {
          title: 'Temps de mise en oeuvre',
          tag: 'Durée',
          options: temps.map((t) => ({ value: t.niveau, label: t.nom })),
          values: tempsValues,
          onChange: (args) =>
            setTempsValues((args as SelectMultipleOnChangeArgs).values),
          multiple: true,
        },
        {
          type: 'checkbox',
          title: 'Élargir au-delà des compétences territoriales',
          tooltip:
            'Certaines actions ne sont pas directement rattachées à un domaine de compétence administrative. Néanmoins, votre collectivité peut s’en emparer en fonction de ses moyens afin de mener sa politique locale de transition (par exemple : coopérer avec les autres échelons territoriaux compétents, modifier et adapter le contenu de l’action en accord avec ses compétences et les spécificités de votre territoire, etc…)',
          value: sansFiltreCompetencesValue,
          onChange: () =>
            setSansFiltreCompetencesValue(!sansFiltreCompetencesValue),
        },
      ]}
      className="my-4"
      btnMenuClassName="-mt-14"
    />
  );
};

export default FiltresActions;
