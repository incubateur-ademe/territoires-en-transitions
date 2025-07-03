import {
  getFilterLabel,
  TYPE_PERIODE_OPTIONS,
} from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/filters/labels';
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
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Filters } from './filters/types';

type Props = {
  title?: string;
  filters: Filtres;
  setFilters: (filters: Filtres) => void;
};

const removeFalsyElementFromFilters = (filters: Filtres): Filtres => {
  const newFilters: Filtres = filters;
  for (const key of Object.keys(newFilters) as (keyof Filtres)[]) {
    if (newFilters[key] === undefined) {
      delete newFilters[key];
    }
  }
  return newFilters;
};

// Generic function for three-state boolean conversions
const createThreeStateConverter = <
  T extends { ALL: string; WITH: string; WITHOUT: string }
>(
  options: T
) => {
  const { ALL, WITH, WITHOUT } = options;

  return {
    toBoolean: (value: T[keyof T] | undefined): boolean | undefined => {
      if (value === undefined || value === ALL) return undefined;
      return value === WITH;
    },
    fromBoolean: (value: boolean | undefined): T[keyof T] => {
      if (value === undefined) return ALL as T[keyof T];
      return (value ? WITH : WITHOUT) as T[keyof T];
    },
    options,
  };
};

// Constants for option values to prevent mistyping
const INDICATEUR_OPTIONS = {
  ALL: 'all',
  WITH: 'withIndicateur',
  WITHOUT: 'withoutIndicateur',
} as const;

const NOTE_OPTIONS = {
  ALL: 'all',
  WITH: 'withNote',
  WITHOUT: 'withoutNote',
} as const;

const MESURE_OPTIONS = {
  ALL: 'all',
  WITH: 'withMesure',
  WITHOUT: 'withoutMesure',
} as const;

const indicateurConverter = createThreeStateConverter(INDICATEUR_OPTIONS);
const noteConverter = createThreeStateConverter(NOTE_OPTIONS);
const mesureConverter = createThreeStateConverter(MESURE_OPTIONS);

const toFilters = (formFilters: Partial<FormFilters>): Filtres => {
  return {
    ...formFilters,
    hasIndicateurLies: indicateurConverter.toBoolean(
      formFilters.hasIndicateurLies
    ),
    hasNoteDeSuivi: noteConverter.toBoolean(formFilters.hasNoteDeSuivi),
    hasMesuresLiees: mesureConverter.toBoolean(formFilters.hasMesuresLiees),
  };
};

const fromFilters = (filters: Filtres): FormFilters => {
  return {
    ...filters,
    hasIndicateurLies: indicateurConverter.fromBoolean(
      filters.hasIndicateurLies
    ),
    hasNoteDeSuivi: noteConverter.fromBoolean(filters.hasNoteDeSuivi),
    hasMesuresLiees: mesureConverter.fromBoolean(filters.hasMesuresLiees),
  };
};

type FormFilters = Omit<
  Filtres,
  'hasIndicateurLies' | 'hasNoteDeSuivi' | 'hasMesuresLiees'
> & {
  hasIndicateurLies:
    | (typeof INDICATEUR_OPTIONS)[keyof typeof INDICATEUR_OPTIONS]
    | undefined;
  hasNoteDeSuivi: (typeof NOTE_OPTIONS)[keyof typeof NOTE_OPTIONS] | undefined;
  hasMesuresLiees:
    | (typeof MESURE_OPTIONS)[keyof typeof MESURE_OPTIONS]
    | undefined;
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
  const shareFicheEnabled = useShareFicheEnabled();

  const debutPeriodeRef = useRef<HTMLInputElement>(null);
  const finPeriodeRef = useRef<HTMLInputElement>(null);

  const { control, subscribe, setValue, watch } = useForm<FormFilters>({
    defaultValues: fromFilters(filters),
  });

  const [typePeriode, finPeriode, debutPeriode] = watch([
    'typePeriode',
    'finPeriode',
    'debutPeriode',
  ]);
  const onSubmit = (data: Partial<FormFilters>) => {
    const filters = toFilters(data);
    const cleanedFilters = removeFalsyElementFromFilters(filters);
    setFilters(cleanedFilters);
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
          className="!grid-cols-1 md:!grid-cols-2 gap-x-8"
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
                      setValue(
                        'personnePiloteIds',
                        pIds.length > 0 ? pIds : undefined
                      );
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
                      setValue(
                        'personneReferenteIds',
                        pIds.length > 0 ? pIds : undefined
                      );
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
                    options={OPTIONS_INDICATEURS}
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
                    options={OPTIONS_NOTES_DE_SUIVI}
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
                    options={OPTIONS_MESURES_LIEES}
                    values={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
          </div>
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
                    values={
                      field.value === undefined
                        ? undefined
                        : field.value
                        ? 'Date renseignée'
                        : 'Date non renseignée'
                    }
                    dataTest="hasDateDeFinPrevisionnelle"
                    options={OPTIONS_FILTRE_DATE_DE_FIN_PREVISIONNELLE}
                    onChange={(value) => {
                      const hasDateDeFinPrevisionnelle = value
                        ? value === 'Date renseignée'
                          ? true
                          : false
                        : undefined;
                      field.onChange(hasDateDeFinPrevisionnelle);
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
                  options={OPTIONS_FILTRE_DATE}
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

        <hr />

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
                  checked={field.value || false}
                  onChange={(event) => {
                    field.onChange(event.target.checked);
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
              name="isBelongsToSeveralPlans"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label={getFilterLabel('isBelongsToSeveralPlans')}
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

// options pour le filtrage par plage de dates
const OPTIONS_FILTRE_DATE: Array<{
  value: NonNullable<Filtres['typePeriode']>;
  label: string;
}> = [
  { value: 'creation', label: 'de création' },
  { value: 'modification', label: 'de modification' },
  { value: 'debut', label: 'de début' },
  { value: 'fin', label: 'de fin prévisionnelle' },
];

const OPTIONS_FILTRE_DATE_DE_FIN_PREVISIONNELLE: Array<{
  value: string;
  label: string;
}> = [
  { label: 'Date renseignée', value: 'Date renseignée' },
  {
    label: 'Date non renseignée',
    value: 'Date non renseignée',
  },
];

const OPTIONS_INDICATEURS = [
  { label: 'Avec indicateurs', value: INDICATEUR_OPTIONS.WITH },
  { label: 'Sans indicateurs', value: INDICATEUR_OPTIONS.WITHOUT },
];

const OPTIONS_NOTES_DE_SUIVI = [
  { label: 'Avec notes de suivi', value: NOTE_OPTIONS.WITH },
  { label: 'Sans notes de suivi', value: NOTE_OPTIONS.WITHOUT },
];

const OPTIONS_MESURES_LIEES = [
  { label: 'Avec mesures liées', value: MESURE_OPTIONS.WITH },
  { label: 'Sans mesures liées', value: MESURE_OPTIONS.WITHOUT },
];

export default MenuFiltresToutesLesFichesAction;
