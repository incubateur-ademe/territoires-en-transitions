import FinanceursDropdown from '@/app/ui/dropdownLists/FinanceursDropdown/FinanceursDropdown';
import PartenairesDropdown from '@/app/ui/dropdownLists/PartenairesDropdown/PartenairesDropdown';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {
  getPilotesValues,
  getReferentsValues,
  splitPilotePersonnesAndUsers,
  splitReferentPersonnesAndUsers,
} from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import PlansActionDropdown from '@/app/ui/dropdownLists/PlansActionDropdown';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import StructuresDropdown from '@/app/ui/dropdownLists/StructuresDropdown/StructuresDropdown';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import CiblesDropdown from '@/app/ui/dropdownLists/ficheAction/CiblesDropdown/CiblesDropdown';
import PrioritesFilterDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesFilterDropdown';
import StatutsFilterDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsFilterDropdown';
import { ListFichesRequestFilters as Filtres } from '@/domain/plans/fiches';
import {
  Checkbox,
  Field,
  FormSection,
  FormSectionGrid,
  InputDateTime,
  Select,
} from '@/ui';
import { useRef } from 'react';
import TagsSuiviPersoDropdown from '../../../../../ui/dropdownLists/TagsSuiviPersoDropdown/TagsSuiviPersoDropdown';
import { getFilterLabel, TYPE_PERIODE_OPTIONS } from './filters/labels';
import { Filters } from './filters/types';

const toggleFilters = <T extends keyof Filtres>(
  previousFilters: Filtres,
  options: {
    key: T;
    value: Filtres[T];
  }
): Filtres => {
  const updatedFilters = { ...previousFilters };
  if (previousFilters[options.key] === options.value) {
    delete updatedFilters[options.key];
    return updatedFilters;
  }
  updatedFilters[options.key] = options.value;
  return updatedFilters;
};

const MenuFiltresToutesLesFichesAction = ({
  title = 'Nouveau filtre :',
  filters,
  setFilters,
}: {
  title?: string;
  filters: Filters;
  setFilters: (filters: Filters) => void;
}) => {
  const pilotes = getPilotesValues(filters);
  const referents = getReferentsValues(filters);

  const debutPeriodeRef = useRef<HTMLInputElement>(null);
  const finPeriodeRef = useRef<HTMLInputElement>(null);
  return (
    <div className="w-96 md:w-[48rem] p-4 lg:p-8">
      <FormSection
        title={title}
        className="!grid-cols-1 md:!grid-cols-2 gap-x-8"
      >
        <div className="*:mb-4 first:!mb-0">
          <Field title={getFilterLabel('planActionIds')}>
            <PlansActionDropdown
              values={filters.planActionIds}
              onChange={({ plans }) => {
                const { planActionIds, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(plans ? { planActionIds: plans } : {}),
                });
              }}
            />
          </Field>

          <Field title={getFilterLabel('utilisateurPiloteIds')}>
            <PersonnesDropdown
              values={pilotes}
              onChange={({ personnes }) => {
                const { personnePiloteIds, utilisateurPiloteIds, ...rest } =
                  filters;
                const { personnePiloteIds: pIds, utilisateurPiloteIds: uIds } =
                  splitPilotePersonnesAndUsers(personnes);
                setFilters({
                  ...rest,
                  ...(pIds.length > 0 ? { personnePiloteIds: pIds } : {}),
                  ...(uIds.length > 0
                    ? {
                        utilisateurPiloteIds: uIds,
                      }
                    : {}),
                });
              }}
            />
          </Field>

          <Field title={getFilterLabel('servicePiloteIds')}>
            <ServicesPilotesDropdown
              values={filters.servicePiloteIds}
              onChange={({ services }) => {
                const { servicePiloteIds, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(services.length > 0
                    ? { servicePiloteIds: services.map((s) => s.id) }
                    : {}),
                });
              }}
            />
          </Field>

          <Field title={getFilterLabel('structurePiloteIds')}>
            <StructuresDropdown
              values={filters.structurePiloteIds}
              onChange={({ structures }) => {
                const { structurePiloteIds, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(structures.length > 0
                    ? { structurePiloteIds: structures.map((s) => s.id) }
                    : {}),
                });
              }}
            />
          </Field>

          <Field title={getFilterLabel('libreTagsIds')}>
            <TagsSuiviPersoDropdown
              values={filters.libreTagsIds}
              onChange={({ libresTag }) => {
                const { libreTagsIds, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(libresTag.length > 0
                    ? { libreTagsIds: libresTag.map((t) => t.id) }
                    : {}),
                });
              }}
            />
          </Field>

          <Field title={getFilterLabel('utilisateurReferentIds')}>
            <PersonnesDropdown
              values={referents}
              onChange={({ personnes }) => {
                const {
                  personneReferenteIds,
                  utilisateurReferentIds,
                  ...rest
                } = filters;
                const {
                  personneReferenteIds: pIds,
                  utilisateurReferentIds: uIds,
                } = splitReferentPersonnesAndUsers(personnes);
                setFilters({
                  ...rest,
                  ...(pIds.length > 0 ? { personneReferenteIds: pIds } : {}),
                  ...(uIds.length > 0
                    ? {
                        utilisateurReferentIds: uIds,
                      }
                    : {}),
                });
              }}
            />
          </Field>
        </div>

        <div className="*:mb-4 first:!mb-0">
          <Field title={getFilterLabel('statuts')}>
            <StatutsFilterDropdown
              values={filters.statuts}
              onChange={({ statuts }) => {
                const { statuts: st, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(statuts ? { statuts } : {}),
                });
              }}
            />
          </Field>
          <Field title={getFilterLabel('priorites')}>
            <PrioritesFilterDropdown
              values={filters.priorites}
              onChange={({ priorites }) => {
                const { priorites: prio, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(priorites ? { priorites } : {}),
                });
              }}
            />
          </Field>
          <Field title={getFilterLabel('thematiqueIds')}>
            <ThematiquesDropdown
              values={filters.thematiqueIds}
              onChange={(thematiques) => {
                const { thematiqueIds, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(thematiques.length > 0
                    ? { thematiqueIds: thematiques.map((t) => t.id) }
                    : {}),
                });
              }}
            />
          </Field>
          <Field title={getFilterLabel('financeurIds')}>
            <FinanceursDropdown
              values={filters.financeurIds}
              onChange={({ financeurs }) => {
                const { financeurIds, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(financeurs.length > 0
                    ? { financeurIds: financeurs.map((f) => f.id!) }
                    : {}),
                });
              }}
            />
          </Field>
          <Field title={getFilterLabel('partenaireIds')}>
            <PartenairesDropdown
              values={filters.partenaireIds}
              onChange={({ partenaires }) => {
                const { partenaireIds, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(partenaires.length > 0
                    ? { partenaireIds: partenaires.map((p) => p.id) }
                    : {}),
                });
              }}
            />
          </Field>
          <Field title={getFilterLabel('cibles')}>
            <CiblesDropdown
              values={filters.cibles}
              onChange={({ cibles: newCibles }) => {
                const { cibles, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(newCibles.length > 0
                    ? { cibles: newCibles.map((c) => c) }
                    : {}),
                });
              }}
            />
          </Field>
        </div>
      </FormSection>

      <hr />

      <FormSectionGrid className="mb-4">
        <Field className="col-span-2" title={getFilterLabel('typePeriode')}>
          <Select
            options={TYPE_PERIODE_OPTIONS}
            values={filters.typePeriode}
            onChange={(value) => {
              return setFilters({
                ...filters,
                typePeriode: value as Filtres['typePeriode'],
                ...(value
                  ? {}
                  : { debutPeriode: undefined, finPeriode: undefined }),
              });
            }}
          />
        </Field>
        <Field title={getFilterLabel('debutPeriode')}>
          <InputDateTime
            ref={debutPeriodeRef}
            disabled={!filters.typePeriode}
            value={filters.debutPeriode}
            max={filters.finPeriode ?? undefined}
            onDateTimeChange={(debutPeriodeValue) => {
              setFilters({
                ...filters,
                debutPeriode: debutPeriodeValue ?? undefined,
              });
            }}
          />
        </Field>
        <Field title={getFilterLabel('finPeriode')}>
          <InputDateTime
            ref={finPeriodeRef}
            disabled={!filters.typePeriode}
            value={filters.finPeriode}
            min={filters.debutPeriode ?? undefined}
            onDateTimeChange={(finPeriodeValue) => {
              setFilters({
                ...filters,
                finPeriode: finPeriodeValue ?? undefined,
              });
            }}
          />
        </Field>
      </FormSectionGrid>

      <hr />

      <FormSectionGrid>
        <div className="flex flex-col gap-4">
          <Checkbox
            label={getFilterLabel('restreint')}
            checked={filters.restreint}
            onChange={() => {
              const { restreint, ...rest } = filters;
              setFilters({
                ...rest,
                ...(!restreint ? { restreint: true } : {}),
              });
            }}
          />
          <Checkbox
            label={getFilterLabel('ameliorationContinue')}
            checked={filters.ameliorationContinue}
            onChange={() => {
              const { ameliorationContinue, ...rest } = filters;
              setFilters({
                ...rest,
                ...(!ameliorationContinue
                  ? { ameliorationContinue: true }
                  : {}),
              });
            }}
          />
          <Checkbox
            label={getFilterLabel('hasIndicateurLies')}
            checked={filters.hasIndicateurLies}
            onChange={() => {
              const { hasIndicateurLies, ...rest } = filters;
              setFilters({
                ...rest,
                ...(!hasIndicateurLies ? { hasIndicateurLies: true } : {}),
              });
            }}
          />
          <Checkbox
            label={getFilterLabel('hasMesuresLiees')}
            checked={filters.hasMesuresLiees === true}
            onChange={() => {
              setFilters(
                toggleFilters(filters, {
                  key: 'hasMesuresLiees',
                  value: true,
                })
              );
            }}
          />
          <Checkbox
            label={getFilterLabel('hasMesuresLiees')}
            checked={filters.hasMesuresLiees === false}
            onChange={() => {
              setFilters(
                toggleFilters(filters, {
                  key: 'hasMesuresLiees',
                  value: false,
                })
              );
            }}
          />
        </div>
        <div className="flex flex-col gap-4">
          <Checkbox
            label={getFilterLabel('noPilote')}
            checked={filters.noPilote}
            onChange={() => {
              const { noPilote, ...rest } = filters;
              setFilters({
                ...rest,
                ...(!noPilote ? { noPilote: true } : {}),
              });
            }}
          />
          <Checkbox
            label={getFilterLabel('noServicePilote')}
            checked={filters.noServicePilote}
            onChange={() => {
              const { noServicePilote, ...rest } = filters;
              setFilters({
                ...rest,
                ...(!noServicePilote ? { noServicePilote: true } : {}),
              });
            }}
          />
          <Checkbox
            label={getFilterLabel('noReferent')}
            checked={filters.noReferent}
            onChange={() => {
              const { noReferent, ...rest } = filters;
              setFilters({
                ...rest,
                ...(!noReferent ? { noReferent: true } : {}),
              });
            }}
          />
          <Checkbox
            label={getFilterLabel('noStatut')}
            checked={filters.noStatut}
            onChange={() => {
              const { noStatut, ...rest } = filters;
              setFilters({
                ...rest,
                ...(!noStatut ? { noStatut: true } : {}),
              });
            }}
          />
        </div>
      </FormSectionGrid>
    </div>
  );
};

export default MenuFiltresToutesLesFichesAction;
