import {
  FILTRE_DATE_DE_FIN_PREVISIONNELLE_OPTIONS,
  INDICATEURS_OPTIONS,
  MESURES_LIEES_OPTIONS,
  NOTES_DE_SUIVI_OPTIONS,
  OPTIONS_PERIOD_TYPE,
} from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/filters/options';
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
import { ListFichesRequestFilters as Filtres } from '@/domain/plans/fiches';
import {
  Checkbox,
  Field,
  FormSection,
  FormSectionGrid,
  InputDateTime,
  Select,
} from '@/ui';
import { Spacer } from '@/ui/design-system/Spacer';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { getFilterLabel } from './filters/labels';
import { FormFilters } from './filters/types';

const removeFalsyElementFromFormFilters = (
  filters: Partial<FormFilters>
): Partial<FormFilters> => {
  const newFilters: Partial<FormFilters> = { ...filters };
  for (const key of Object.keys(newFilters) as (keyof FormFilters)[]) {
    if (newFilters[key] === undefined) {
      delete newFilters[key];
    }
  }
  return newFilters;
};

export const ToutesLesFichesFiltersForm = ({
  title = 'Filtres',
  filters,
  setFilters,
}: {
  title?: string;
  filters: FormFilters;
  setFilters: (filters: FormFilters) => void;
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

  const onSubmit = (data: Partial<FormFilters>) => {
    const cleanedFilters = removeFalsyElementFromFormFilters(data);
    setFilters(cleanedFilters as FormFilters);
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
                      field.onChange(plans);
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
                      field.onChange(pIds.length > 0 ? pIds : undefined);
                      setValue(
                        'utilisateurPiloteIds',
                        uIds.length > 0 ? uIds : undefined
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
                          : undefined;
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
                          : undefined;
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
                          : undefined;
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
                      field.onChange(pIds.length > 0 ? pIds : undefined);
                      setValue(
                        'utilisateurReferentIds',
                        uIds.length > 0 ? uIds : undefined
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
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>

            <Field title="Notes de suivi">
              <Controller
                name="hasNoteDeSuivi"
                control={control}
                render={({ field }) => (
                  <Select
                    options={NOTES_DE_SUIVI_OPTIONS}
                    values={field.value}
                    onChange={field.onChange}
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
                    onChange={field.onChange}
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
                      field.onChange(statuts ?? []);
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
                      field.onChange(priorites);
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
                          ? thematiques.map((t) => t.id)
                          : undefined;
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
                          ? financeurs.map((f) => f.id!)
                          : undefined;
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
                          : undefined;
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
                          : undefined;
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
                      field.onChange(value);
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
                        value && value.length > 0 ? value : undefined;
                      field.onChange(anneesNoteDeSuivi);
                    }}
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
                    field.onChange(typePeriode);
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
                  className="text-ellipsis"
                  ref={debutPeriodeRef}
                  disabled={!typePeriode}
                  value={field.value}
                  max={finPeriode}
                  onDateTimeChange={(debutPeriodeValue) => {
                    const debutPeriode = debutPeriodeValue ?? undefined;
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
                    const finPeriode = finPeriodeValue ?? undefined;
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
