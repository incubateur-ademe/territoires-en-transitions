'use client';

import { appLabels } from '@/app/labels/catalog';
import { DEBUT_HISTORIQUE_STATUTS } from '@tet/domain/plans';
import { Alert, Checkbox, Input, Select } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { ReactNode } from 'react';
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  useQueryState,
} from 'nuqs';
import { useGetEvolutionStatuts } from '../data/use-get-evolution-statuts';
import { ORDRE_STATUTS } from '../statut-suivi-colors';
import { SuiviPlanBloc } from '../suivi-plan.bloc';
import { ThematiquesFilterButton } from '../thematiques-filter.button';
import { EvolutionStatutsTable } from './evolution-statuts.table';
import {
  formatDateCourte,
  PeriodeEvolution,
  periodeEvolutionOptions,
} from './periode-evolution';
import { StatutsBar } from './statuts.bar';
import { usePeriodeEvolution } from './use-periode-evolution';

const PeriodeField = ({
  titre,
  className,
  children,
}: {
  titre: string;
  className?: string;
  children: ReactNode;
}) => (
  <div className={cn('flex flex-col gap-1', className)}>
    <span className="text-sm font-medium text-primary-9">{titre}</span>
    {children}
  </div>
);

export const EvolutionStatutsBloc = ({
  collectiviteId,
  planId,
  dateDebutPlan,
}: {
  collectiviteId: number;
  planId: number;
  dateDebutPlan: string;
}) => {
  const [thematiqueIds, setThematiqueIds] = useQueryState(
    'evolutionStatutsThematiques',
    parseAsArrayOf(parseAsInteger).withDefault([])
  );
  const [inclureActionsContinues, setInclureActionsContinues] = useQueryState(
    'evolutionActionsContinues',
    parseAsBoolean.withDefault(false)
  );
  const {
    periode,
    dateDebut,
    dateFin,
    aujourdhui,
    isDateFinAujourdhui,
    setPeriode,
    setDateDebut,
    setDateFin,
  } = usePeriodeEvolution(dateDebutPlan);

  const { data, isPlaceholderData } = useGetEvolutionStatuts({
    planId,
    thematiqueIds,
    dateDebut,
    dateFin,
    inclureActionsContinues,
  });
  const isLoading = data === undefined || isPlaceholderData;

  const isDateDebutRamenee = dateDebut < DEBUT_HISTORIQUE_STATUTS;
  const dateDebutRetenue = formatDateCourte(
    isDateDebutRamenee ? DEBUT_HISTORIQUE_STATUTS : dateDebut
  );
  const dateFinAffichee = isDateFinAujourdhui
    ? null
    : formatDateCourte(dateFin);

  const rows = ORDRE_STATUTS.map((statut) => {
    const compte = data?.parStatut.find((row) => row.statut === statut);
    return { statut, debut: compte?.debut ?? 0, fin: compte?.fin ?? 0 };
  }).filter(({ statut, debut, fin }) => statut !== null || debut + fin > 0);
  const totaux: [number, number] = [data?.totalDebut ?? 0, data?.totalFin ?? 0];

  return (
    <SuiviPlanBloc
      titre={appLabels.evolutionStatutsTitre}
      sousTitre={appLabels.evolutionStatutsPeriodeTitre({
        debut: dateDebutRetenue,
        fin: dateFinAffichee,
      })}
      dataTest="plans.suivi.evolution-statuts"
      actions={
        <ThematiquesFilterButton
          thematiqueIds={thematiqueIds}
          onChange={setThematiqueIds}
          dataTest="plans.suivi.evolution-statuts.filtre-thematiques"
        />
      }
    >
      <div className="flex flex-wrap items-end gap-4">
        <PeriodeField
          titre={appLabels.evolutionStatutsPeriode}
          className="w-72"
        >
          <Select
            options={periodeEvolutionOptions}
            values={periode}
            onChange={(value) => value && setPeriode(value as PeriodeEvolution)}
            custom={{
              renderValueItem: (option) => (
                <span className="text-sm text-primary-9">{option.label}</span>
              ),
            }}
            dataTest="plans.suivi.evolution-statuts.periode"
          />
        </PeriodeField>
        {periode === 'personnalisee' && (
          <>
            <PeriodeField titre={appLabels.evolutionStatutsDu} className="w-44">
              <Input
                type="date"
                value={dateDebut}
                max={dateFin}
                onChange={(evt) =>
                  evt.target.value && setDateDebut(evt.target.value)
                }
                data-test="plans.suivi.evolution-statuts.date-debut"
              />
            </PeriodeField>
            <PeriodeField titre={appLabels.evolutionStatutsAu} className="w-44">
              <Input
                type="date"
                value={dateFin}
                min={dateDebut}
                max={aujourdhui}
                onChange={(evt) =>
                  evt.target.value && setDateFin(evt.target.value)
                }
                data-test="plans.suivi.evolution-statuts.date-fin"
              />
            </PeriodeField>
          </>
        )}
      </div>

      {isDateDebutRamenee && (
        <Alert
          state="info"
          title={appLabels.evolutionStatutsHistoriqueRamene}
        />
      )}

      <div className="grid gap-12 grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <StatutsBar
            titre={appLabels.evolutionStatutsStatutsAu(dateDebutRetenue)}
            legende={appLabels.evolutionStatutsExistaient(totaux[0])}
            total={totaux[0]}
            isLoading={isLoading}
            statuts={rows.map(({ statut, debut }) => ({
              statut,
              count: debut,
            }))}
            dataTest="plans.suivi.evolution-statuts.barre-debut"
          />
          <StatutsBar
            titre={appLabels.evolutionStatutsStatutsAu(dateFinAffichee)}
            legende={appLabels.evolutionStatutsCreees({
              total: totaux[1],
              creees: data?.creeesDepuisDebut ?? 0,
              date: dateDebutRetenue,
            })}
            total={totaux[1]}
            isLoading={isLoading}
            statuts={rows.map(({ statut, fin }) => ({ statut, count: fin }))}
            dataTest="plans.suivi.evolution-statuts.barre-fin"
          />
          <div className="pt-6 border-t border-grey-3">
            <Checkbox
              label={appLabels.evolutionStatutsInclureActionsContinues}
              message={
                isLoading ? (
                  <span className="inline-block w-80 h-4 rounded bg-grey-3 animate-pulse" />
                ) : (
                  appLabels.evolutionStatutsActionsContinuesInfo(
                    data.actionsContinues
                  )
                )
              }
              checked={inclureActionsContinues}
              onChange={(evt) => setInclureActionsContinues(evt.target.checked)}
              data-test="plans.suivi.evolution-statuts.actions-continues"
            />
          </div>
        </div>
        <EvolutionStatutsTable
          collectiviteId={collectiviteId}
          planId={planId}
          rows={rows}
          totaux={totaux}
          isLoading={isLoading}
          libelles={[
            dateDebutRetenue,
            dateFinAffichee ?? appLabels.evolutionStatutsAujourdhui,
          ]}
        />
      </div>
    </SuiviPlanBloc>
  );
};
