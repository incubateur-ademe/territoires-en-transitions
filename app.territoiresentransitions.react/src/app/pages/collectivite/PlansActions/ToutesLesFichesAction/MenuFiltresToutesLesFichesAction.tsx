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
import SelectWithTrueFalseUndefinedValueDropdown from '@/app/ui/dropdownLists/SelectWithTrueFalseUndefinedValueDropdown';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import StructuresDropdown from '@/app/ui/dropdownLists/StructuresDropdown/StructuresDropdown';
import TagsSuiviPersoDropdown from '@/app/ui/dropdownLists/TagsSuiviPersoDropdown/TagsSuiviPersoDropdown';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import { removeFalsyElementFromFilters } from '@/app/utils/filtersToParamsUtils';
import { ListFichesRequestFilters as Filtres } from '@/domain/plans/fiches';
import {
  Checkbox,
  Field,
  FormSection,
  FormSectionGrid,
  InputDateTime,
  Select,
  SelectOption,
} from '@/ui';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';

type Props = {
  title?: string;
  filters: Filtres;
  setFilters: (filters: Filtres) => void;
};

const MenuFiltresToutesLesFichesAction = ({
  title = 'Nouveau filtre :',
  filters,
  setFilters,
}: Props) => {
  const pilotes = getPilotesValues(filters);
  const referents = getReferentsValues(filters);
  const shareFicheEnabled = useShareFicheEnabled();

  const debutPeriodeRef = useRef<HTMLInputElement>(null);
  const finPeriodeRef = useRef<HTMLInputElement>(null);

  const { control, subscribe, setValue, watch } = useForm<Filtres>({
    defaultValues: filters,
  });

  const [typePeriode, finPeriode, debutPeriode] = watch([
    'typePeriode',
    'finPeriode',
    'debutPeriode',
  ]);
  const onSubmit = (data: Partial<Filtres>) => {
    const cleanedFilters = removeFalsyElementFromFilters(data);
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

            <Field title="Personne pilote">
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

            <Field title="Direction ou service pilote">
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

            <Field title="Structure pilote">
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

            <Field title="Tags personnalisés">
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

            <Field title="Élu·e référent·e">
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

            <Field title="Indicateur(s) associé(s)">
              <Controller
                name="hasIndicateurLies"
                control={control}
                render={({ field }) => (
                  <SelectWithTrueFalseUndefinedValueDropdown
                    values={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                    }}
                    trueLabel={'Fiches avec indicateurs'}
                    falseLabel={'Fiches sans indicateurs'}
                  />
                )}
              />
            </Field>

            <Field title="Notes de suivi">
              <Controller
                name="hasNoteDeSuivi"
                control={control}
                render={({ field }) => (
                  <SelectWithTrueFalseUndefinedValueDropdown
                    values={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                    }}
                    trueLabel={'Fiches avec notes de suivi'}
                    falseLabel={'Fiches sans notes de suivi'}
                  />
                )}
              />
            </Field>

            <Field title="Mesure(s) des référentiels liée(s)">
              <Controller
                name="hasMesuresLiees"
                control={control}
                render={({ field }) => (
                  <SelectWithTrueFalseUndefinedValueDropdown
                    values={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                    }}
                    trueLabel={'Fiches avec mesure(s) des référentiels liée(s)'}
                    falseLabel={
                      'Fiches sans mesure(s) des référentiels liée(s)'
                    }
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

            <Field title="Niveau de priorité">
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

            <Field title="Thématique">
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

            <Field title="Financeur">
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

            <Field title="Partenaires">
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

            <Field title="Cibles">
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

            <Field title="Date de fin prévisionnelle">
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

            <Field title="Années des notes de suivi">
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
          <Field className="col-span-2" title="Période appliquée à la date">
            <Controller
              name="typePeriode"
              control={control}
              render={({ field }) => (
                <Select
                  options={OPTIONS_FILTRE_DATE as SelectOption[]}
                  values={field.value}
                  onChange={(value) => {
                    const typePeriode = value as Filtres['typePeriode'];
                    field.onChange(typePeriode);
                  }}
                />
              )}
            />
          </Field>

          <Field title="Du">
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

          <Field title="Au">
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
                  label="Sans pilote"
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
                  label="Sans direction ou service pilote"
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
                  label="Sans élu·e référent·e"
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
                  label="Sans statut"
                  checked={field.value || false}
                  onChange={(event) => {
                    field.onChange(event.target.checked);
                  }}
                />
              )}
            />

            {shareFicheEnabled && (
              <Checkbox
                label="Fiche action mutualisée avec d'autres collectivités"
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
                  label="Sans tags personnalisés"
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
                  label="Sans niveau de priorité"
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
                  label="Fiche action en mode privé"
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
                  label="L'action se répète tous les ans"
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
                  label="Actions mutualisées dans plusieurs plans"
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
  value: Filtres['typePeriode'];
  label: string;
}> = [
  { value: 'creation', label: 'de création' },
  { value: 'modification', label: 'de modification' },
  { value: 'debut', label: 'de début' },
  { value: 'fin', label: 'de fin prévisionnelle' },
];
// options pour le filtrage par dates de
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

export default MenuFiltresToutesLesFichesAction;
