'use client';

import {useEffect, useState} from 'react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {
  ActionImpactFourchetteBudgetaire,
  ActionImpactTempsMiseEnOeuvre,
  ActionImpactThematique,
} from '@tet/api';
import {
  Button,
  Field,
  OptionValue,
  SelectMultiple,
  useEventTracker,
} from '@tet/ui';
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
  // const [competencesValue, setCompetencesValue] = useState(false);

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
    // if (!!competencesParams)
    //   setCompetencesValue(competencesParams === 'true' ? true : false);

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
    // if (competencesValue) paramsArray.push('c=true');

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

  const handleClearFilters = () => {
    setThematiquesValues(undefined);
    setBudgetsValues(undefined);
    setTempsValues(undefined);
  };

  return (
    <div className="mb-8 relative z-10 bg-white p-6 rounded-lg border-[0.5px] border-primary-3">
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Field title="Thématiques" small>
          <SelectMultiple
            options={thematiques.map(t => ({value: t.id, label: t.nom}))}
            values={thematiquesValues}
            onChange={({values}) => {
              setThematiquesValues(values);
            }}
            small
          />
        </Field>
        <Field title="Ordre de grandeur budgétaire" small>
          <SelectMultiple
            options={budgets.map(b => ({value: b.niveau, label: b.nom}))}
            values={budgetsValues}
            onChange={({values}) => {
              setBudgetsValues(values);
            }}
            small
          />
        </Field>
        <Field title="Temps de mise en oeuvre" small>
          <SelectMultiple
            options={temps.map(t => ({value: t.niveau, label: t.nom}))}
            values={tempsValues}
            onChange={({values}) => {
              setTempsValues(values);
            }}
            small
          />
        </Field>
        <div className="flex justify-end max-xl:items-end xl:col-span-3 mt-4">
          <Button
            variant="grey"
            size="xs"
            icon="delete-bin-6-line"
            onClick={handleClearFilters}
          >
            Supprimer tous les filtres
          </Button>
        </div>
      </div>

      {/* <div className="mt-8">
        <Checkbox
          label="Élargir au delà de mes compétences"
          message="Certaines actions ne sont pas directement rattachées à un domaine de compétence territoriale. Néanmoins, votre collectivité peut s’en emparer afin d’enrichir sa politique locale de transition."
          checked={competencesValue}
          onChange={() => setCompetencesValue(prevState => !prevState)}
        />
      </div> */}
    </div>
  );
};

export default FiltresActions;
