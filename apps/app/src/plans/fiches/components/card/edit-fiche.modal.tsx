import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { appLabels } from '@/app/labels/catalog';
import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import PrioritesSelectDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesSelectDropdown';
import StatutsSelectDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import { getIsoFormattedDate } from '@/app/utils/formatUtils';
import {
  Checkbox,
  Event,
  Field,
  FormSectionGrid,
  Input,
  useEventTracker,
} from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { UpdateFicheModalBody } from '../update-fiche-modal-body';

type Props = {
  initialFiche: FicheListItem;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

/**
 * Modale pour modifier une fiche action.
 */
export const EditFicheModal = ({ initialFiche, isOpen, setIsOpen }: Props) => {
  const tracker = useEventTracker();

  useEffect(() => {
    if (isOpen) {
      tracker(Event.fiches.updateModaleOuverture);
    }
  }, [isOpen, tracker]);

  const { mutate: updateFiche } = useUpdateFiche();

  const [fiche, setFiche] = useState(initialFiche);

  const refDateDebut = useRef<HTMLInputElement>(null);
  const refDateFin = useRef<HTMLInputElement>(null);

  return (
    <Modal
      openState={{ isOpen: isOpen, setIsOpen: (open) => {
        setIsOpen(open);
        if (!open) setFiche(initialFiche);
       }}}
      size="lg"
    >
      <Modal.Header>
        <Modal.Title>{appLabels.modifierAction}</Modal.Title>
      </Modal.Header>
      <UpdateFicheModalBody fiche={initialFiche}>
        <div className="flex flex-col gap-6">
          <Field title={appLabels.champNomAction}>
            <Input
              type="text"
              value={fiche.titre ?? undefined}
              onChange={(e) => setFiche({ ...fiche, titre: e.target.value })}
              placeholder={appLabels.sansTitre}
              autoFocus
            />
          </Field>
          <FormSectionGrid>
            <Field title={appLabels.statut}>
              <StatutsSelectDropdown
                values={fiche.statut}
                onChange={(statut) =>
                  setFiche({
                    ...fiche,
                    statut: statut ?? null,
                  })
                }
              />
            </Field>
            <Field title={appLabels.niveauPriorite}>
              <PrioritesSelectDropdown
                values={fiche.priorite}
                onChange={(priorite) =>
                  setFiche({
                    ...fiche,
                    priorite: priorite ?? null,
                  })
                }
              />
            </Field>
          </FormSectionGrid>
          <Field title={appLabels.personnePilote}>
            <PersonneTagDropdown
              values={fiche.pilotes?.map((p) => getPersonneStringId(p))}
              onChange={({ personnes }) => {
                setFiche({
                  ...fiche,
                  // TODO: virer ce cast force quand on utilisera le même type `PersonneTagOrUser` partout
                  pilotes: personnes.map((p) => ({
                    ...p,
                    nom: p.nom ?? '',
                  })),
                });
              }}
            />
          </Field>
          <FormSectionGrid>
            <Field title={appLabels.dateDebut}>
              <Input
                ref={refDateDebut}
                type="date"
                max={
                  fiche.dateFin !== null
                    ? getIsoFormattedDate(fiche.dateFin)
                    : undefined
                }
                value={
                  fiche.dateDebut
                    ? format(new Date(fiche.dateDebut), 'yyyy-MM-dd')
                    : ''
                }
                onChange={(e) =>
                  setFiche({
                    ...fiche,
                    dateDebut:
                      e.target.value.length !== 0 ? e.target.value : null,
                  })
                }
              />
            </Field>
            <Field title={appLabels.champDateFinPrevisionnelle}>
              <Input
                ref={refDateFin}
                type="date"
                min={
                  fiche.dateDebut !== null
                    ? getIsoFormattedDate(fiche.dateDebut)
                    : undefined
                }
                value={
                  fiche.dateFin
                    ? format(new Date(fiche.dateFin), 'yyyy-MM-dd')
                    : ''
                }
                onChange={(e) =>
                  setFiche({
                    ...fiche,
                    dateFin:
                      e.target.value.length !== 0 ? e.target.value : null,
                  })
                }
                disabled={fiche.ameliorationContinue ?? false}
              />
              <div className="mt-2">
                <Checkbox
                  label={appLabels.actionRepeteTousLesAns}
                  message={appLabels.checkboxSansDateFinPrevisionnelle}
                  onChange={() => {
                    setFiche({
                      ...fiche,
                      ameliorationContinue: !fiche.ameliorationContinue,
                      dateFin: null,
                    });
                  }}
                  checked={!!fiche.ameliorationContinue}
                />
              </div>
            </Field>
          </FormSectionGrid>
        </div>
      </UpdateFicheModalBody>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        <Modal.Ok
          onClick={() => {
            updateFiche({ ficheId: fiche.id, ficheFields: fiche });
            tracker(Event.fiches.updateModaleValidation);
            setIsOpen(false);
          }}
        >
          {appLabels.valider}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};
