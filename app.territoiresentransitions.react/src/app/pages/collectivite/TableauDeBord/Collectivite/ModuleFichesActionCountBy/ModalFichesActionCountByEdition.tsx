import { useState } from 'react';

import {
  Divider,
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
import { cloneDeep, pick } from 'es-toolkit';

import { useCollectiviteModuleUpsert } from '@/app/app/pages/collectivite/TableauDeBord/Collectivite/useCollectiviteModuleUpsert';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { CreateModuleFicheActionCountByType } from '@/backend/collectivites/tableau-de-bord/module-fiche-action-count-by.schema';
import {
  CountByPropertyEnumType,
  ficheActionForCountBySchema,
} from '@/domain/plans/fiches';
import MenuFiltresToutesLesFichesAction from '../../../PlansActions/ToutesLesFichesAction/MenuFiltresToutesLesFichesAction';

const ModalFichesActionCountByEditionStep = {
  GENERAL_PARAMETERS: 1,
  FILTER: 2,
} as const;

export const countByPropertyOptions: Option[] = Object.entries(
  ficheActionForCountBySchema.shape
)
  .map(([key, value]) => ({
    value: key,
    label: value.description || key,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

const getNewModule = (
  collectiviteId: number
): CreateModuleFicheActionCountByType => {
  return {
    id: crypto.randomUUID(),
    titre: '',
    collectiviteId,
    type: 'fiche-action.count-by',
    options: {
      countByProperty: '' as CountByPropertyEnumType, // We want the user to select a value
      filtre: {},
    },
  };
};

type Props = ModalProps & {
  module?: CreateModuleFicheActionCountByType;
};
const ModalFichesActionCountByEdition = ({ openState, module }: Props) => {
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectiviteId;
  const { mutate: upsertCollectiviteModule } = useCollectiviteModuleUpsert();

  const [editionStep, setEditionStep] = useState<number>(
    ModalFichesActionCountByEditionStep.GENERAL_PARAMETERS
  );

  const [moduleState, setModuleState] =
    useState<CreateModuleFicheActionCountByType>(
      cloneDeep(module) || getNewModule(collectiviteId || 0)
    );

  const trackEvent = useEventTracker('app/tdb/collectivite');

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
        if (
          editionStep === ModalFichesActionCountByEditionStep.GENERAL_PARAMETERS
        ) {
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
            <MenuFiltresToutesLesFichesAction
              title="Etape 2/2 : Choisissez les conditions applicables aux fiches actions"
              filters={moduleState.options.filtre}
              setFilters={(filtre) => {
                setModuleState({
                  ...moduleState,
                  options: {
                    ...moduleState.options,
                    filtre,
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
          currentStep={editionStep}
          cantGoToNextStep={
            editionStep === 1 &&
            (!moduleState.titre || !moduleState.options.countByProperty)
          }
          onStepChange={(step) => setEditionStep(step)}
          btnCancelProps={{
            onClick: () => {
              close();

              setEditionStep(
                ModalFichesActionCountByEditionStep.GENERAL_PARAMETERS
              );
            },
          }}
          btnOKProps={{
            children: module ? 'Modifier le module' : 'Ajouter le module',
            onClick: () => {
              upsertCollectiviteModule(moduleState);

              close();

              if (!module) {
                trackEvent('tdb_valider_module_perso', {
                  ...pick(collectivite!, [
                    'collectiviteId',
                    'niveauAcces',
                    'role',
                  ]),
                  countByProperty: moduleState.options.countByProperty,
                });
              }

              setEditionStep(
                ModalFichesActionCountByEditionStep.GENERAL_PARAMETERS
              );
            },
          }}
        />
      )}
    />
  );
};

export default ModalFichesActionCountByEdition;
