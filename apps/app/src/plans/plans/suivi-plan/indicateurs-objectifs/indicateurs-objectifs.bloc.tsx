'use client';

import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  getHorizonParDefaut,
  INDICATEURS_OBJECTIFS_HORIZONS,
} from '@tet/domain/plans';
import {
  Alert,
  Button,
  ButtonGroup,
  Icon,
  SearchCombobox,
  type SearchComboboxSelection,
} from '@tet/ui';
import {
  parseAsNumberLiteral,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs';
import { useMemo, useState } from 'react';
import { useGetIndicateursObjectifs } from '../data/use-get-indicateurs-objectifs';
import { SuiviPlanBloc } from '../suivi-plan.bloc';
import { IndicateurObjectifCard } from './indicateur-objectif.card';
import {
  buildSearchIndicateursSuggestions,
  filterIndicateursObjectifs,
  INDICATEURS_OBJECTIFS_FILTRES_SOURCE,
  IndicateursObjectifsFiltreSource,
} from './search-indicateurs-objectifs';

const NB_INDICATEURS_VISIBLES = 6;

const FILTRE_SOURCE_LABELS: Record<IndicateursObjectifsFiltreSource, string> = {
  tous: appLabels.indicateursObjectifsAfficherTous,
  reglementaires: appLabels.indicateursObjectifsAfficherReglementaires,
  plan: appLabels.indicateursObjectifsAfficherPlan,
};

export const IndicateursObjectifsBloc = ({
  collectiviteId,
  planId,
}: {
  collectiviteId: number;
  planId: number;
}) => {
  const { data: indicateurs, isError } = useGetIndicateursObjectifs({
    planId,
  });
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const canMutateValeurs = hasCollectivitePermission(
    'indicateurs.valeurs.mutate'
  );

  const [horizon, setHorizon] = useQueryState(
    'indicateursHorizon',
    parseAsNumberLiteral(INDICATEURS_OBJECTIFS_HORIZONS).withDefault(
      getHorizonParDefaut(new Date().getFullYear())
    )
  );
  const [source, setSource] = useQueryState(
    'indicateursSource',
    parseAsStringLiteral(INDICATEURS_OBJECTIFS_FILTRES_SOURCE).withDefault(
      'tous'
    )
  );
  const [recherche, setRecherche] = useState('');
  const [selectionIds, setSelectionIds] = useState<number[]>([]);
  const [isAllVisible, setIsAllVisible] = useState(false);

  const getSuggestions = useMemo(
    () =>
      indicateurs ? buildSearchIndicateursSuggestions(indicateurs) : undefined,
    [indicateurs]
  );
  // badges et filtre de source n'ont de sens que pour un plan du dépôt PCAET
  const hasReglementaires =
    indicateurs?.some(({ sources }) => sources.includes('reglementaire')) ??
    false;
  const filtres = indicateurs
    ? filterIndicateursObjectifs(indicateurs, {
        recherche,
        selectionIds,
        source: hasReglementaires ? source : 'tous',
      })
    : [];
  const visibles = isAllVisible
    ? filtres
    : filtres.slice(0, NB_INDICATEURS_VISIBLES);
  const nbMasques = filtres.length - NB_INDICATEURS_VISIBLES;

  const selections: SearchComboboxSelection[] = selectionIds.map((id) => ({
    id: String(id),
    label: indicateurs?.find((indicateur) => indicateur.id === id)?.titre ?? '',
  }));
  const toggleSelection = (id: number) =>
    setSelectionIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
    );

  return (
    <SuiviPlanBloc
      titre={appLabels.indicateursObjectifsTitre}
      dataTest="plans.suivi.indicateurs-objectifs"
      actions={
        <div className="flex items-center gap-2 text-sm text-grey-8">
          {appLabels.indicateursObjectifsHorizon}
          <ButtonGroup
            size="xs"
            label={appLabels.indicateursObjectifsHorizon}
            activeButtonId={String(horizon)}
            buttons={INDICATEURS_OBJECTIFS_HORIZONS.map((annee) => ({
              id: String(annee),
              children: String(annee),
              onClick: () => setHorizon(annee),
              'data-test': `plans.suivi.indicateurs-objectifs.horizon-${annee}`,
            }))}
          />
        </div>
      }
    >
      {isError ? (
        <Alert
          state="error"
          title={appLabels.indicateursObjectifsErreurChargement}
        />
      ) : indicateurs === undefined ? (
        <div className="flex justify-center p-12">
          <Icon icon="loader-4-line" className="animate-spin text-grey-6" />
        </div>
      ) : indicateurs.length === 0 ? (
        <p className="mb-0 text-sm text-grey-8">
          {appLabels.indicateursObjectifsAucun}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div
            className="flex flex-wrap items-center gap-x-6 gap-y-3"
            data-html2canvas-ignore
          >
            <SearchCombobox
              label={appLabels.indicateursObjectifsRecherche}
              placeholder={appLabels.indicateursObjectifsRecherche}
              value={recherche}
              onSearch={(value) => {
                setRecherche(value);
                setIsAllVisible(false);
              }}
              debounce={200}
              getSuggestions={getSuggestions}
              isOptionSelected={(option) =>
                selectionIds.includes(Number(option.id))
              }
              onSelectOption={(option) => toggleSelection(Number(option.id))}
              onDeselectOption={(option) => toggleSelection(Number(option.id))}
              selections={selections}
              onRemoveSelection={(id) => toggleSelection(Number(id))}
              fieldClassName="w-full sm:w-[28rem]"
              data-test="plans.suivi.indicateurs-objectifs.recherche"
            />
            {hasReglementaires && (
              <div className="flex items-center gap-2 text-sm text-grey-8">
                {appLabels.indicateursObjectifsAfficher}
                <ButtonGroup
                  size="xs"
                  label={appLabels.indicateursObjectifsAfficher}
                  activeButtonId={source}
                  buttons={INDICATEURS_OBJECTIFS_FILTRES_SOURCE.map(
                    (filtre) => ({
                      id: filtre,
                      children: FILTRE_SOURCE_LABELS[filtre],
                      onClick: () => {
                        setSource(filtre);
                        setIsAllVisible(false);
                      },
                      'data-test': `plans.suivi.indicateurs-objectifs.afficher-${filtre}`,
                    })
                  )}
                />
              </div>
            )}
          </div>

          {filtres.length === 0 ? (
            <p className="mb-0 text-sm text-grey-8">
              {appLabels.indicateursObjectifsAucunRecherche}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibles.map((indicateur) => (
                <IndicateurObjectifCard
                  key={indicateur.id}
                  collectiviteId={collectiviteId}
                  indicateur={indicateur}
                  horizon={horizon}
                  canMutateValeurs={canMutateValeurs}
                  showSources={hasReglementaires}
                />
              ))}
            </div>
          )}

          {nbMasques > 0 && (
            <Button
              variant="unstyled"
              size="sm"
              className="flex items-center gap-1 self-start text-sm text-primary-9"
              icon={isAllVisible ? 'arrow-up-s-line' : 'arrow-down-s-line'}
              iconPosition="right"
              onClick={() => setIsAllVisible((visible) => !visible)}
              dataTest="plans.suivi.indicateurs-objectifs.voir-plus"
              data-html2canvas-ignore
            >
              {isAllVisible
                ? appLabels.indicateursObjectifsVoirMoins
                : appLabels.indicateursObjectifsVoirPlus(nbMasques)}
            </Button>
          )}
        </div>
      )}
    </SuiviPlanBloc>
  );
};
