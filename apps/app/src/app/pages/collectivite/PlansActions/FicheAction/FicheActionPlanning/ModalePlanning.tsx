import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import MiseEnOeuvreDropdown from '@/app/ui/dropdownLists/ficheAction/MiseEnOeuvreDropdown/MiseEnOeuvreDropdown';
import PrioritesSelectDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesSelectDropdown';
import StatutsSelectDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import { getIsoFormattedDate } from '@/app/utils/formatUtils';
import {
  Checkbox,
  Event,
  Field,
  FormSectionGrid,
  Input,
  ModalFooterOKCancel,
  Textarea,
  useEventTracker,
} from '@/ui';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useUpdateFiche } from '../data/use-update-fiche';
type ModalePlanningProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: Fiche;
};

const ModalePlanning = ({ isOpen, setIsOpen, fiche }: ModalePlanningProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);
  const [isDateDebutError, setIsDateDebutError] = useState(false);
  // Il y avait un bug à l'affichage avec des dates comme 0021-01-01
  const [isDateDebutInf1900Error, setIsDateDebutInf1900Error] = useState(false);
  const [isDateFinError, setIsDateFinError] = useState(false);
  const [isDateFinInf1900Error, setIsDateFinInf1900Error] = useState(false);

  const tracker = useEventTracker();
  const { mutate: updateFiche } = useUpdateFiche();

  useEffect(() => {
    if (isOpen) setEditedFiche(fiche);
  }, [isOpen, fiche]);

  const handleSave = () => {
    if (!_.isEqual(fiche, editedFiche)) {
      updateFiche({
        ficheId: fiche.id,
        ficheFields: {
          dateDebut: editedFiche.dateDebut,
          dateFin: editedFiche.dateFin,
          ameliorationContinue: editedFiche.ameliorationContinue,
          tempsDeMiseEnOeuvre: editedFiche.tempsDeMiseEnOeuvre,
          statut: editedFiche.statut,
          priorite: editedFiche.priorite,
          calendrier: editedFiche.calendrier,
        },
      });
    }
  };

  const dateDebutRef = useRef<HTMLInputElement>(null);
  const dateFinRef = useRef<HTMLInputElement>(null);

  const handleDateDebutChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (new Date(evt.target.value) < new Date('1900-01-01')) {
      setIsDateDebutInf1900Error(true);
    } else {
      setIsDateDebutInf1900Error(false);
    }
    if (
      editedFiche.dateFin &&
      new Date(evt.target.value) > new Date(editedFiche.dateFin)
    ) {
      setIsDateDebutError(true);
    } else {
      setIsDateDebutError(false);
      setEditedFiche((prevState) => ({
        ...prevState,
        dateDebut: evt.target.value.length !== 0 ? evt.target.value : null,
      }));
    }
  };

  const handleDateFinChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (new Date(evt.target.value) < new Date('1900-01-01')) {
      setIsDateFinInf1900Error(true);
    } else {
      setIsDateFinInf1900Error(false);
    }
    if (
      editedFiche.dateDebut &&
      new Date(evt.target.value) < new Date(editedFiche.dateDebut)
    ) {
      setIsDateFinError(true);
    } else setIsDateFinError(false);

    setEditedFiche((prevState) => ({
      ...prevState,
      dateFin: evt.target.value.length !== 0 ? evt.target.value : null,
    }));
  };

  return (
    <BaseUpdateFicheModal
      openState={{ isOpen, setIsOpen }}
      title="Planning prévisionnel"
      fiche={fiche}
      size="lg"
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {/* Date de début */}
          <Field
            title="Date de début"
            className="max-md:col-span-2"
            state={
              isDateDebutError || isDateDebutInf1900Error ? 'error' : 'default'
            }
            message={
              isDateDebutError
                ? 'La date de début doit être antérieure à la date de fin prévisionnelle'
                : isDateDebutInf1900Error
                ? 'La date de début doit être postérieure au 1er janvier 1900'
                : undefined
            }
          >
            <Input
              ref={dateDebutRef}
              type="date"
              state={isDateDebutError ? 'error' : 'default'}
              min="1900-01-01"
              max={
                editedFiche.dateFin
                  ? getIsoFormattedDate(editedFiche.dateFin)
                  : undefined
              }
              value={
                editedFiche.dateDebut
                  ? getIsoFormattedDate(editedFiche.dateDebut)
                  : ''
              }
              onChange={(evt) => handleDateDebutChange(evt)}
            />
          </Field>

          {/* Date de fin prévisionnelle */}
          <Field
            title="Date de fin prévisionnelle"
            className="max-md:col-span-2"
            state={
              isDateFinError || isDateFinInf1900Error ? 'error' : 'default'
            }
            message={
              isDateFinError
                ? 'La date de fin prévisionnelle doit être postérieure à la date de début'
                : isDateFinInf1900Error
                ? 'La date de fin prévisionnelle doit être postérieure au 1er janvier 1900'
                : undefined
            }
          >
            <Input
              ref={dateFinRef}
              type="date"
              state={isDateFinError ? 'error' : 'default'}
              min={
                editedFiche.dateDebut !== null
                  ? getIsoFormattedDate(editedFiche.dateDebut ?? '')
                  : undefined
              }
              title={
                editedFiche.ameliorationContinue
                  ? "Ce champ ne peut pas être modifié si l'action se répète tous les ans"
                  : undefined
              }
              disabled={editedFiche.ameliorationContinue ?? false}
              value={
                editedFiche.dateFin
                  ? getIsoFormattedDate(editedFiche.dateFin)
                  : ''
              }
              onChange={(evt) => handleDateFinChange(evt)}
            />
          </Field>

          {/* Amélioration continue */}
          <div className="col-span-2 mb-2">
            <Checkbox
              label="L'action se répète tous les ans"
              message="Sans date de fin prévisionnelle"
              checked={editedFiche.ameliorationContinue ?? false}
              onChange={(evt) => {
                const isChecked = evt.target.checked;
                const dateFin = isChecked ? null : editedFiche.dateFin;
                setEditedFiche((prevState) => ({
                  ...prevState,
                  ameliorationContinue: isChecked,
                  dateFin: dateFin,
                }));
              }}
            />
          </div>

          {/* Temps de mise en oeuvre */}
          <Field title="Temps de mise en œuvre" className="col-span-2">
            <MiseEnOeuvreDropdown
              values={editedFiche.tempsDeMiseEnOeuvre}
              onChange={(tempsDeMiseEnOeuvre) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  tempsDeMiseEnOeuvre: tempsDeMiseEnOeuvre ?? null,
                }))
              }
            />
          </Field>

          {/* Statut */}
          <Field title="Statut" className="max-md:col-span-2">
            <StatutsSelectDropdown
              values={editedFiche.statut}
              onChange={(statut) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  statut: statut ?? null,
                }))
              }
            />
          </Field>

          {/* Niveau de priorité */}
          <Field title="Niveau de priorité" className="max-md:col-span-2">
            <PrioritesSelectDropdown
              values={editedFiche.priorite}
              onChange={(priorite) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  priorite: priorite ?? null,
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
              onChange={(evt) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  calendrier: (evt.target as HTMLTextAreaElement).value,
                }))
              }
            />
          </Field>
        </FormSectionGrid>
      )}
      // Boutons pour valider / annuler les modifications
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            disabled: isDateDebutError || isDateFinError,
            onClick: () => {
              tracker(Event.fiches.updatePlanning.one);
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
