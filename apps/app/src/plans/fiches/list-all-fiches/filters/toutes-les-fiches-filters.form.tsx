import { useShareFicheEnabled } from '@/app/plans/fiches/share-fiche/use-share-fiche-enabled';
import { AnneesNoteDeSuiviDropdown } from '@/app/ui/dropdownLists/ficheAction/AnneesNoteDeSuiviDropdown/AnneeNoteDeSuiviDropdown';
import CiblesDropdown from '@/app/ui/dropdownLists/ficheAction/CiblesDropdown/CiblesDropdown';
import PrioritesFilterDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesFilterDropdown';
import StatutsFilterDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsFilterDropdown';
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
import TagsSuiviPersoDropdown from '@/app/ui/dropdownLists/TagsSuiviPersoDropdown/TagsSuiviPersoDropdown';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import { ListFichesRequestFilters as Filtres } from '@/domain/plans';
import {
  Checkbox,
  Field,
  FormSection,
  FormSectionGrid,
  InputDateTime,
  Select,
  Spacer,
} from '@/ui';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { getFilterLabel } from './labels';
import {
  BUDGET_OPTIONS,
  FILTRE_DATE_DE_FIN_PREVISIONNELLE_OPTIONS,
  INDICATEURS_OPTIONS,
  MESURES_LIEES_OPTIONS,
  NOTES_DE_SUIVI_OPTIONS,
  OPTIONS_PERIOD_TYPE,
} from './options';
import { FormFilters } from './types';

/**
 * https://react-hook-form.com/docs/usecontroller/controller
 * "onChange" must not be called with undefined values otherwise the form will use default values
 */
const EMPTY_VALUE = '';
const EMPTY_ARRAY_VALUE: number[] | string[] = [];

export const ToutesLesFichesFiltersForm = ({
  title = 'Filtres',
  filters,
  setFilters,
}: {
  title?: string;
  filters: FormFilters;
  setFilters: (filters: Partial<FormFilters>) => void;
}) => {
  const pilotes = getPilotesValues(filters);
  const referents = getReferentsValues(filters);
  const shareFicheEnabled = useShareFicheEnabled();

  const debutPeriodeRef = useRef<HTMLInputElement>(null);
  const finPeriodeRef = useRef<HTMLInputElement>(null);

  const { control, subscribe, setValue, watch } = useForm<FormFilters>({
    defaultValues: filters,
  });

  const [typePeriode, finPeriode, debutPeriode] = watch([
    'typePeriode',
    'finPeriode',
    'debutPeriode',
  ]);

  const onSubmit = (data: FormFilters) => {
    setFilters(data);
  };

  useEffect(() => {
    const unsubscribe = subscribe({
      formState: {
        values: true,
      },
      callback: (data) => {
        onSubmit(data.values);
      },
    });
    return () => unsubscribe();
  }, [subscribe]);

  return (
    <div className="w-96 md:w-[48rem] p-4 lg:p-8">
      <form>
        <FormSection
          title={title}
          className="grid-cols-1 md:grid-cols-2 gap-x-8"
        >
          <div className="*:mb-4 first:!mb-0">
            <Field title="Plans d'action">
              <Controller
                name="planActionIds"
                control={control}
                render={({ field }) => (
                  <PlansActionDropdown
                    values={field.value}
                    onChange={({ plans }) => {
                      field.onChange(plans ?? EMPTY_ARRAY_VALUE);
                    }}
                  />
                )}
              />
            </Field>

            <Field title={getFilterLabel('personnePiloteIds')}>
              <Controller
                name="personnePiloteIds"
                control={control}
                render={({ field }) => (
                  <PersonnesDropdown
                    values={pilotes}
                    onChange={({ personnes }) => {
                      const {
                        personnePiloteIds: pIds,
                        utilisateurPiloteIds: uIds,
                      } = splitPilotePersonnesAndUsers(personnes);
                      field.onChange(
                        pIds.length > 0 ? pIds : (EMPTY_ARRAY_VALUE as number[])
                      );
                      setValue(
                        'utilisateurPiloteIds',
                        uIds.length > 0 ? uIds : (EMPTY_ARRAY_VALUE as string[])
                      );
                    }}
                  />
                )}
              />
            </Field>

            <Field title={getFilterLabel('servicePiloteIds')}>
              <Controller
                name="servicePiloteIds"
                control={control}
                render={({ field }) => (
                  <ServicesPilotesDropdown
                    values={field.value}
                    onChange={({ services }) => {
                      const serviceIds =
                        services.length > 0
                          ? services.map((s) => s.id)
                          : EMPTY_ARRAY_VALUE;
                      field.onChange(serviceIds);
                    }}
                  />
                )}
              />
            </Field>

            <Field title={getFilterLabel('structurePiloteIds')}>
              <Controller
                name="structurePiloteIds"
                control={control}
                render={({ field }) => (
                  <StructuresDropdown
                    values={field.value}
                    onChange={({ structures }) => {
                      const structureIds =
                        structures.length > 0
                          ? structures.map((s) => s.id)
                          : EMPTY_ARRAY_VALUE;
                      field.onChange(structureIds);
                    }}
                  />
                )}
              />
            </Field>

            <Field title={getFilterLabel('libreTagsIds')}>
              <Controller
                name="libreTagsIds"
                control={control}
                render={({ field }) => (
                  <TagsSuiviPersoDropdown
                    values={field.value}
                    onChange={({ libresTag }) => {
                      const tagIds =
                        libresTag.length > 0
                          ? libresTag.map((t) => t.id)
                          : EMPTY_ARRAY_VALUE;
                      field.onChange(tagIds);
                    }}
                  />
                )}
              />
            </Field>

            <Field title={getFilterLabel('personneReferenteIds')}>
              <Controller
                name="personneReferenteIds"
                control={control}
                render={({ field }) => (
                  <PersonnesDropdown
                    values={referents}
                    onChange={({ personnes }) => {
                      const {
                        personneReferenteIds: pIds,
                        utilisateurReferentIds: uIds,
                      } = splitReferentPersonnesAndUsers(personnes);
                      field.onChange(
                        pIds.length > 0 ? pIds : (EMPTY_ARRAY_VALUE as number[])
                      );
                      setValue(
                        'utilisateurReferentIds',
                        uIds.length > 0 ? uIds : (EMPTY_ARRAY_VALUE as string[])
                      );
                    }}
                  />
                )}
              />
            </Field>

            <Field title={getFilterLabel('hasIndicateurLies')}>
              <Controller
                name="hasIndicateurLies"
                control={control}
                render={({ field }) => (
                  <Select
                    options={INDICATEURS_OPTIONS}
                    values={field.value}
                    onChange={(v) => field.onChange(v ?? EMPTY_VALUE)}
                  />
                )}
              />
            </Field>

            <Field title="Notes de suivi">
              <Controller
                name="notesDeSuivi"
                control={control}
                render={({ field }) => (
                  <Select
                    options={NOTES_DE_SUIVI_OPTIONS}
                    values={field.value}
                    onChange={(v) => field.onChange(v ?? EMPTY_VALUE)}
                  />
                )}
              />
            </Field>

            <Field title="Mesure(s) des référentiels liée(s)">
              <Controller
                name="hasMesuresLiees"
                control={control}
                render={({ field }) => (
                  <Select
                    options={MESURES_LIEES_OPTIONS}
                    values={field.value}
                    onChange={(v) => field.onChange(v ?? EMPTY_VALUE)}
                  />
                )}
              />
            </Field>
          </div>

          <div className="*:mb-4 first:!mb-0">
            <Field title="Statut de l'action">
              <Controller
                name="statuts"
                control={control}
                render={({ field }) => (
                  <StatutsFilterDropdown
                    values={field.value}
                    onChange={({ statuts }) => {
                      field.onChange(statuts ?? EMPTY_ARRAY_VALUE);
                    }}
                  />
                )}
              />
            </Field>
            <Field title={getFilterLabel('priorites')}>
              <Controller
                name="priorites"
                control={control}
                render={({ field }) => (
                  <PrioritesFilterDropdown
                    values={field.value}
                    onChange={({ priorites }) => {
                      field.onChange(priorites ?? EMPTY_ARRAY_VALUE);
                    }}
                  />
                )}
              />
            </Field>
            <Field title={getFilterLabel('thematiqueIds')}>
              <Controller
                name="thematiqueIds"
                control={control}
                render={({ field }) => (
                  <ThematiquesDropdown
                    values={field.value}
                    onChange={(thematiques) => {
                      const thematiqueIds =
                        thematiques.length > 0
                          ? thematiques
                          : EMPTY_ARRAY_VALUE;
                      field.onChange(thematiqueIds);
                    }}
                  />
                )}
              />
            </Field>
            <Field title={getFilterLabel('financeurIds')}>
              <Controller
                name="financeurIds"
                control={control}
                render={({ field }) => (
                  <FinanceursDropdown
                    values={field.value}
                    onChange={({ financeurs }) => {
                      const financeurIds =
                        financeurs.length > 0
                          ? financeurs.map((f) => f.id)
                          : EMPTY_ARRAY_VALUE;
                      field.onChange(financeurIds);
                    }}
                  />
                )}
              />
            </Field>
            <Field title={getFilterLabel('partenaireIds')}>
              <Controller
                name="partenaireIds"
                control={control}
                render={({ field }) => (
                  <PartenairesDropdown
                    values={field.value}
                    onChange={({ partenaires }) => {
                      const partenaireIds =
                        partenaires.length > 0
                          ? partenaires.map((p) => p.id)
                          : EMPTY_ARRAY_VALUE;
                      field.onChange(partenaireIds);
                    }}
                  />
                )}
              />
            </Field>
            <Field title={getFilterLabel('cibles')}>
              <Controller
                name="cibles"
                control={control}
                render={({ field }) => (
                  <CiblesDropdown
                    values={field.value}
                    onChange={({ cibles: newCibles }) => {
                      const cibles =
                        newCibles.length > 0
                          ? newCibles.map((c) => c)
                          : EMPTY_ARRAY_VALUE;
                      field.onChange(cibles);
                    }}
                  />
                )}
              />
            </Field>
            <Field title={getFilterLabel('hasDateDeFinPrevisionnelle')}>
              <Controller
                name="hasDateDeFinPrevisionnelle"
                control={control}
                render={({ field }) => (
                  <Select
                    values={field.value as string}
                    dataTest="hasDateDeFinPrevisionnelle"
                    options={FILTRE_DATE_DE_FIN_PREVISIONNELLE_OPTIONS}
                    onChange={(value) => {
                      field.onChange(value ?? EMPTY_VALUE);
                    }}
                  />
                )}
              />
            </Field>
            <Field title={getFilterLabel('anneesNoteDeSuivi')}>
              <Controller
                name="anneesNoteDeSuivi"
                control={control}
                render={({ field }) => (
                  <AnneesNoteDeSuiviDropdown
                    values={field.value}
                    onChange={(value: string[]) => {
                      const anneesNoteDeSuivi =
                        value && value.length > 0 ? value : EMPTY_ARRAY_VALUE;
                      field.onChange(anneesNoteDeSuivi ?? EMPTY_VALUE);
                    }}
                  />
                )}
              />
            </Field>
            <Field title={getFilterLabel('hasBudget')}>
              <Controller
                name="hasBudget"
                control={control}
                render={({ field }) => (
                  <Select
                    options={BUDGET_OPTIONS}
                    values={field.value}
                    onChange={(v) => field.onChange(v ?? EMPTY_VALUE)}
                  />
                )}
              />
            </Field>
          </div>
        </FormSection>

        <FormSectionGrid className="mb-4">
          <Field className="col-span-2" title={getFilterLabel('typePeriode')}>
            <Controller
              name="typePeriode"
              control={control}
              render={({ field }) => (
                <Select
                  options={OPTIONS_PERIOD_TYPE}
                  values={field.value}
                  onChange={(value) => {
                    const typePeriode = value as Filtres['typePeriode'];
                    if (!typePeriode) {
                      setValue('debutPeriode', EMPTY_VALUE);
                      setValue('finPeriode', EMPTY_VALUE);
                    }
                    field.onChange(typePeriode ?? EMPTY_VALUE);
                  }}
                />
              )}
            />
          </Field>

          <Field title={getFilterLabel('debutPeriode')}>
            <Controller
              name="debutPeriode"
              control={control}
              render={({ field }) => (
                <InputDateTime
                  ref={debutPeriodeRef}
                  disabled={!typePeriode}
                  value={field.value}
                  max={finPeriode}
                  onDateTimeChange={(debutPeriodeValue) => {
                    const debutPeriode = debutPeriodeValue ?? EMPTY_VALUE;
                    field.onChange(debutPeriode);
                  }}
                />
              )}
            />
          </Field>

          <Field title={getFilterLabel('finPeriode')}>
            <Controller
              name="finPeriode"
              control={control}
              render={({ field }) => (
                <InputDateTime
                  ref={finPeriodeRef}
                  disabled={!typePeriode}
                  value={field.value}
                  min={debutPeriode}
                  onDateTimeChange={(finPeriodeValue) => {
                    const finPeriode = finPeriodeValue ?? EMPTY_VALUE;
                    field.onChange(finPeriode);
                  }}
                />
              )}
            />
          </Field>
        </FormSectionGrid>

        <Spacer height={1} />
        <FormSectionGrid className="mb-4">
          <div className="flex flex-col gap-4">
            <Controller
              name="noPilote"
              control={control}
              render={({ field }) => (
                /**
                 * Checkbox is controlled hence one must use `Controller`
                 * A refactoring of Checkbox would be needed to make it
                 * work seemlessly with react-hook-form
                 */
                <Checkbox
                  label={getFilterLabel('noPilote')}
                  checked={field.value}
                  onChange={(event) => {
                    field.onChange(event.target.checked ?? undefined);
                  }}
                />
              )}
            />

            <Controller
              name="noServicePilote"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label={getFilterLabel('noServicePilote')}
                  checked={field.value || false}
                  onChange={(event) => {
                    field.onChange(event.target.checked);
                  }}
                />
              )}
            />

            <Controller
              name="noReferent"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label={getFilterLabel('noReferent')}
                  checked={field.value || false}
                  onChange={(event) => {
                    field.onChange(event.target.checked);
                  }}
                />
              )}
            />

            <Controller
              name="noStatut"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label={getFilterLabel('noStatut')}
                  checked={field.value || false}
                  onChange={(event) => {
                    field.onChange(event.target.checked);
                  }}
                />
              )}
            />

            {shareFicheEnabled && (
              <Checkbox
                label={getFilterLabel('sharedWithCollectivites')}
                checked={filters.sharedWithCollectivites}
                onChange={() => {
                  const { sharedWithCollectivites, ...rest } = filters;
                  setFilters({
                    ...rest,
                    ...(!sharedWithCollectivites
                      ? { sharedWithCollectivites: true }
                      : {}),
                  });
                }}
              />
            )}

            <Controller
              name="noTag"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label={getFilterLabel('noTag')}
                  checked={field.value || false}
                  onChange={(event) => {
                    field.onChange(event.target.checked);
                  }}
                />
              )}
            />

            <Controller
              name="noPriorite"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label={getFilterLabel('noPriorite')}
                  checked={field.value || false}
                  onChange={(event) => {
                    field.onChange(event.target.checked);
                  }}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-4">
            <Controller
              name="restreint"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label={getFilterLabel('restreint')}
                  checked={field.value || false}
                  onChange={(event) => {
                    field.onChange(event.target.checked);
                  }}
                />
              )}
            />

            <Controller
              name="ameliorationContinue"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label={getFilterLabel('ameliorationContinue')}
                  checked={field.value || false}
                  onChange={(event) => {
                    field.onChange(event.target.checked);
                  }}
                />
              )}
            />

            <Controller
              name="doesBelongToSeveralPlans"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label={getFilterLabel('doesBelongToSeveralPlans')}
                  checked={field.value || false}
                  onChange={(event) => {
                    field.onChange(event.target.checked);
                  }}
                />
              )}
            />
          </div>
        </FormSectionGrid>
      </form>
    </div>
  );
};
