import {useEffect, useState} from 'react';
import _ from 'lodash';
import {
  Checkbox,
  Field,
  FormSectionGrid,
  Input,
  Modal,
  ModalFooterOKCancel,
  Textarea,
  useEventTracker,
} from '@tet/ui';
import {FicheAction} from '../data/types';
import {getIsoFormattedDate} from '../utils';
import StatutsSelectDropdown from 'ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import PrioritesSelectDropdown from 'ui/dropdownLists/ficheAction/priorites/PrioritesSelectDropdown';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

type ModalePlanningProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const ModalePlanning = ({
  isOpen,
  setIsOpen,
  fiche,
  updateFiche,
}: ModalePlanningProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);
  const [isDateDebutError, setIsDateDebutError] = useState(false);
  const [isDateFinError, setIsDateFinError] = useState(false);

  const tracker = useEventTracker('app/fiche-action');
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectivite_id || null;

  useEffect(() => {
    if (isOpen) setEditedFiche(fiche);
  }, [isOpen]);

  const handleSave = () => {
    if (!_.isEqual(fiche, editedFiche)) {
      updateFiche(editedFiche);
    }
  };

  return (
    <Modal
      openState={{isOpen, setIsOpen}}
      title="Planning prévisionnel"
      size="lg"
      render={({descriptionId}) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {/* Date de début */}
          <Field
            title="Date de début"
            className="col-span-2"
            state={isDateDebutError ? 'error' : 'default'}
            message={
              isDateDebutError
                ? 'La date de début doit être antérieure à la date de fin prévisionnelle'
                : undefined
            }
          >
            <Input
              type="date"
              state={isDateDebutError ? 'error' : 'default'}
              max={
                editedFiche.date_fin_provisoire !== null
                  ? getIsoFormattedDate(editedFiche.date_fin_provisoire)
                  : undefined
              }
              value={
                editedFiche.date_debut
                  ? getIsoFormattedDate(editedFiche.date_debut)
                  : ''
              }
              onChange={evt => {
                if (
                  editedFiche.date_fin_provisoire !== null &&
                  new Date(evt.target.value) >
                    new Date(editedFiche.date_fin_provisoire)
                ) {
                  setIsDateDebutError(true);
                } else setIsDateDebutError(false);

                setEditedFiche(prevState => ({
                  ...prevState,
                  date_debut:
                    evt.target.value.length !== 0 ? evt.target.value : null,
                }));
              }}
            />
          </Field>

          <div className="col-span-2 mb-2">
            <Checkbox
              label="L'action se répète tous les ans"
              message="Sans date de fin prévisionnelle"
              checked={editedFiche.amelioration_continue ?? false}
              onChange={evt => {
                const isChecked = evt.target.checked;
                const dateFin = isChecked
                  ? null
                  : editedFiche.date_fin_provisoire;
                setEditedFiche(prevState => ({
                  ...prevState,
                  amelioration_continue: isChecked,
                  date_fin_provisoire: dateFin,
                }));
              }}
            />
          </div>

          {/* Date de fin prévisionnelle */}
          <Field
            title="Date de fin prévisionnelle"
            className="col-span-2"
            state={isDateFinError ? 'error' : 'default'}
            message={
              isDateFinError
                ? 'La date de fin prévisionnelle doit être postérieure à la date de début'
                : undefined
            }
          >
            <Input
              type="date"
              state={isDateFinError ? 'error' : 'default'}
              min={
                editedFiche.date_debut !== null
                  ? getIsoFormattedDate(editedFiche.date_debut)
                  : undefined
              }
              title={
                editedFiche.amelioration_continue
                  ? "Ce champ ne peut pas être modifié si l'action se répète tous les ans"
                  : undefined
              }
              disabled={editedFiche.amelioration_continue ?? false}
              value={
                editedFiche.date_fin_provisoire
                  ? getIsoFormattedDate(editedFiche.date_fin_provisoire)
                  : ''
              }
              onChange={evt => {
                if (
                  editedFiche.date_debut !== null &&
                  new Date(evt.target.value) < new Date(editedFiche.date_debut)
                ) {
                  setIsDateFinError(true);
                } else setIsDateFinError(false);

                setEditedFiche(prevState => ({
                  ...prevState,
                  date_fin_provisoire:
                    evt.target.value.length !== 0 ? evt.target.value : null,
                }));
              }}
            />
          </Field>

          {/* Statut */}
          <Field title="Statut" className="max-md:col-span-2">
            <StatutsSelectDropdown
              values={editedFiche.statut}
              onChange={statut =>
                setEditedFiche(prevState => ({
                  ...prevState,
                  statut,
                }))
              }
            />
          </Field>

          {/* Niveau de priorité */}
          <Field title="Niveau de priorité" className="max-md:col-span-2">
            <PrioritesSelectDropdown
              values={editedFiche.niveau_priorite}
              onChange={priorite =>
                setEditedFiche(prevState => ({
                  ...prevState,
                  niveau_priorite: priorite,
                }))
              }
            />
          </Field>

          {/* Justification du calendrier */}
          <Field
            title="Calendrier"
            hint="Si l’action est en pause ou abandonnée, expliquez pourquoi"
            className="col-span-2"
          >
            <Textarea
              className="min-h-[50px]"
              value={editedFiche.calendrier ?? ''}
              onChange={evt =>
                setEditedFiche(prevState => ({
                  ...prevState,
                  calendrier: (evt.target as HTMLTextAreaElement).value,
                }))
              }
            />
          </Field>
        </FormSectionGrid>
      )}
      // Boutons pour valider / annuler les modifications
      renderFooter={({close}) => (
        <ModalFooterOKCancel
          btnCancelProps={{onClick: close}}
          btnOKProps={{
            disabled: isDateDebutError || isDateFinError,
            onClick: () => {
              collectiviteId &&
                tracker('validation_modale_planning_fa', {
                  collectivite_id: collectiviteId,
                });
              handleSave();
              close();
            },
          }}
        />
      )}
    />
  );
};

export default ModalePlanning;