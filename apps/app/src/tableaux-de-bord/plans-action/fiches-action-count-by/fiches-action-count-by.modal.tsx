import { appLabels } from '@/app/labels/catalog';
import {
  fromFiltersToFormFilters,
  fromFormFiltersToFilters,
} from '@/app/plans/fiches/list-all-fiches/filters/filter-converter';
import { ToutesLesFichesFiltersForm } from '@/app/plans/fiches/list-all-fiches/filters/toutes-les-fiches-filters.form';
import { FormFilters } from '@/app/plans/fiches/list-all-fiches/filters/types';
import { ModuleFicheCountFilters } from '@tet/domain/metrics';
import {
  countByPropertyEnumSchema,
  CountByPropertyEnumType,
  ficheActionForCountBySchema,
} from '@tet/domain/plans';
import {
  Field,
  FormSection,
  Input,
  Modal,
  ModalFooterOKCancelWithSteps,
  ModalProps,
  Select,
} from '@tet/ui';
import { useState } from 'react';

const PARAMETRES = 1;

export type FichesActionCountByValues = {
  titre: string;
  countByProperty: CountByPropertyEnumType;
  filtre: ModuleFicheCountFilters;
};

const toOptions = (properties: readonly CountByPropertyEnumType[]) =>
  properties
    .map((value) => ({
      value,
      label: ficheActionForCountBySchema.shape[value].description || value,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

export const FichesActionCountByModal = ({
  openState,
  initialValues,
  countByProperties = countByPropertyEnumSchema.options,
  readonlyFilters,
  hiddenFilters,
  onSave,
}: {
  openState: ModalProps['openState'];
  initialValues?: FichesActionCountByValues;
  countByProperties?: readonly CountByPropertyEnumType[];
  readonlyFilters?: Partial<FormFilters>;
  hiddenFilters?: ReadonlyArray<keyof FormFilters>;
  onSave: (values: FichesActionCountByValues) => void;
}) => {
  const [step, setStep] = useState(PARAMETRES);
  const [titre, setTitre] = useState(initialValues?.titre ?? '');
  const [countByProperty, setCountByProperty] = useState(
    initialValues?.countByProperty
  );
  const [filtre, setFiltre] = useState<ModuleFicheCountFilters>(
    initialValues?.filtre ?? {}
  );

  return (
    <Modal
      openState={openState}
      size="lg"
      title={
        initialValues
          ? appLabels.modifierModulePersonnalise
          : appLabels.ajouterModulePersonnalise
      }
      render={() =>
        step === PARAMETRES ? (
          <FormSection
            title={appLabels.tdbCreationModulePersonnalise1}
            className="!grid-cols-1"
          >
            <Field title={appLabels.moduleCountByNom}>
              <Input
                type="text"
                placeholder={appLabels.moduleCountByNomPlaceholder}
                value={titre}
                onChange={(event) => setTitre(event.target.value)}
              />
            </Field>
            <Field
              title={appLabels.moduleCountByCritere}
              state="info"
              message={appLabels.moduleCountByCritereInfo}
            >
              <Select
                placeholder={appLabels.moduleCountByCriterePlaceholder}
                options={toOptions(countByProperties)}
                values={countByProperty}
                onChange={(value) => {
                  if (value) {
                    setCountByProperty(value as CountByPropertyEnumType);
                  }
                }}
              />
            </Field>
          </FormSection>
        ) : (
          <ToutesLesFichesFiltersForm
            title={appLabels.tdbCreationModulePersonnalise2}
            filters={{
              ...fromFiltersToFormFilters(filtre),
              ...readonlyFilters,
            }}
            readonlyFilters={readonlyFilters}
            hiddenFilters={hiddenFilters}
            setFilters={(formFilters) =>
              setFiltre(fromFormFiltersToFilters(formFilters))
            }
          />
        )
      }
      renderFooter={({ close }) => (
        <ModalFooterOKCancelWithSteps
          stepsCount={2}
          currentStep={step}
          cantGoToNextStep={
            step === PARAMETRES && (!titre.trim() || !countByProperty)
          }
          onStepChange={setStep}
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            children: initialValues
              ? appLabels.moduleCountByModifier
              : appLabels.moduleCountByAjouter,
            onClick: () => {
              if (countByProperty) {
                onSave({ titre, countByProperty, filtre });
              }
              close();
            },
          }}
        />
      )}
    />
  );
};
