import { cloneDeep } from 'es-toolkit';
import { useState } from 'react';

import {
  Divider,
  Event,
  Field,
  FormSection,
  Input,
  Modal,
  ModalFooterOKCancelWithSteps,
  ModalProps,
  Option,
  Select,
  useEventTracker,
} from '@/ui';

import { useCurrentCollectivite } from '@/api/collectivites';
import {
  fromFiltersToFormFilters,
  fromFormFiltersToFilters,
} from '@/app/plans/fiches/list-all-fiches/filters/filter-converter';
import { ToutesLesFichesFiltersForm } from '@/app/plans/fiches/list-all-fiches/filters/toutes-les-fiches-filters.form';
import { CreateModuleFicheActionCountByType } from '@/domain/collectivites';
import {
  CountByPropertyEnumType,
  ficheActionForCountBySchema,
} from '@/domain/plans/fiches';
import { useUpsertModule } from '../_hooks/use-upsert-module';

const editionStep = {
  GENERAL_PARAMETERS: 1,
  FILTER: 2,
} as const;

const countByPropertyOptions: Option[] = Object.entries(
  ficheActionForCountBySchema.shape
)
  .map(([key, value]) => ({
    value: key,
    label: value.description || key,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

type Props = ModalProps & {
  module?: CreateModuleFicheActionCountByType;
};
const TdbPaFichesActionCountModal = ({ openState, module }: Props) => {
  const collectivite = useCurrentCollectivite();

  const { mutate: upsertCollectiviteModule } = useUpsertModule();

  const [step, setStep] = useState<number>(editionStep.GENERAL_PARAMETERS);

  const [moduleState, setModuleState] =
    useState<CreateModuleFicheActionCountByType>(
      cloneDeep(module) || {
        id: crypto.randomUUID(),
        titre: '',
        collectiviteId: collectivite.collectiviteId,
        type: 'fiche-action.count-by',
        options: {
          countByProperty: '' as CountByPropertyEnumType, // We want the user to select a value
          filtre: {},
        },
      }
    );

  const tracker = useEventTracker();
  return (
    <Modal
      openState={openState}
      size="lg"
      title={
        module
          ? 'Modifier un module personnalisé'
          : 'Créer un module personnalisé'
      }
      render={() => {
        if (step === editionStep.GENERAL_PARAMETERS) {
          return (
            <>
              <FormSection
                title="Étape 1/2 : Paramétrez votre nouveau graphique circulaire"
                className="!grid-cols-1"
              >
                <Field title="Nom du module :" className="md:col-span-3">
                  <Input
                    placeholder="Ajouter un titre"
                    type="text"
                    value={moduleState.titre}
                    onChange={(evt) => {
                      setModuleState({
                        ...moduleState,
                        titre: evt.target.value,
                      });
                    }}
                  />
                </Field>

                <Field
                  title="Répartition des fiches action par :"
                  state="info"
                  message="Ce paramètre vous permet de choisir l’affichage selon lequel votre graphique sera trié."
                  className="md:col-span-3"
                >
                  <Select
                    placeholder="Sélectionner une valeur"
                    options={countByPropertyOptions}
                    values={moduleState.options.countByProperty}
                    onChange={(v) => {
                      if (v) {
                        setModuleState({
                          ...moduleState,
                          options: {
                            ...moduleState.options,
                            countByProperty:
                              v.toString() as CountByPropertyEnumType,
                          },
                        });
                      }
                    }}
                  />
                </Field>
              </FormSection>
              <Divider />
            </>
          );
        } else {
          return (
            <ToutesLesFichesFiltersForm
              title="Etape 2/2 : Choisissez les conditions applicables aux fiches actions"
              filters={fromFiltersToFormFilters(moduleState.options.filtre)}
              setFilters={(filtre) => {
                setModuleState({
                  ...moduleState,
                  options: {
                    ...moduleState.options,
                    filtre: fromFormFiltersToFilters(filtre),
                  },
                });
              }}
            />
          );
        }
      }}
      renderFooter={({ close }) => (
        <ModalFooterOKCancelWithSteps
          stepsCount={2}
          currentStep={step}
          cantGoToNextStep={
            step === 1 &&
            (!moduleState.titre || !moduleState.options.countByProperty)
          }
          onStepChange={(step) => setStep(step)}
          btnCancelProps={{
            onClick: () => {
              close();

              setStep(editionStep.GENERAL_PARAMETERS);
            },
          }}
          btnOKProps={{
            children: module ? 'Modifier le module' : 'Ajouter le module',
            onClick: () => {
              upsertCollectiviteModule(moduleState);

              close();

              if (!module) {
                tracker(Event.tdb.validateModulePerso, {
                  countByProperty: moduleState.options.countByProperty,
                });
              }

              setStep(editionStep.GENERAL_PARAMETERS);
            },
          }}
        />
      )}
    />
  );
};

export default TdbPaFichesActionCountModal;
