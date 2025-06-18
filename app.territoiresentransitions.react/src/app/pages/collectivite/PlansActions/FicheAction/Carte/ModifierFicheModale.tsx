import { useUpdateFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-update-fiche';
import {
  useFicheActionAddPilote,
  useFicheActionRemoveTagPilote,
  useFicheActionRemoveUserPilote,
} from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useFicheActionPilote';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import PrioritesSelectDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesSelectDropdown';
import StatutsSelectDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import { FicheResume } from '@/domain/plans/fiches';
import {
  Checkbox,
  Field,
  FormSectionGrid,
  Input,
  Modal,
  ModalFooterOKCancel,
} from '@/ui';
import { format } from 'date-fns';
import { useRef, useState } from 'react';
import { QueryKey } from 'react-query';

type Props = {
  initialFiche: FicheResume;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  keysToInvalidate?: QueryKey[];
};

/**
 * Modale pour modifier une fiche action.
 */
const ModifierFicheModale = ({
  initialFiche,
  isOpen,
  setIsOpen,
  keysToInvalidate,
}: Props) => {
  const { mutate: updateFiche } = useUpdateFiche();

  const { mutate: addPilotes } = useFicheActionAddPilote(keysToInvalidate);
  const { mutate: removeUserPilotes } =
    useFicheActionRemoveUserPilote(keysToInvalidate);
  const { mutate: removeTagPilotes } =
    useFicheActionRemoveTagPilote(keysToInvalidate);

  const [fiche, setFiche] = useState(initialFiche);

  const refDatefin = useRef<HTMLInputElement>(null);

  return (
    <Modal
      dataTest="ModifierFicheModale"
      size="lg"
      openState={{
        isOpen,
        setIsOpen,
      }}
      onClose={() => setFiche(initialFiche)}
      title="Modifier la fiche action"
      render={({ close }) => {
        return (
          <div className="flex flex-col gap-6">
            <Field title="Nom de la fiche action">
              <Input
                data-test="FicheNomInput"
                type="text"
                value={fiche.titre ?? undefined}
                onChange={(e) => setFiche({ ...fiche, titre: e.target.value })}
                placeholder="Sans titre"
                autoFocus
              />
            </Field>
            <FormSectionGrid>
              <Field title="Statut">
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
              <Field title="Niveau de priorité">
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
            <FormSectionGrid>
              <Field title="Personne pilote">
                <PersonnesDropdown
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
              <Field title="Date de fin prévisionnelle">
                <Input
                  ref={refDatefin}
                  type="date"
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
                    label="L'action se répète tous les ans"
                    message="Sans date de fin prévisionnelle"
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
            <ModalFooterOKCancel
              btnOKProps={{
                onClick: () => {
                  const pilotesToAdd =
                    fiche.pilotes
                      ?.filter(
                        (finalPilote) =>
                          !initialFiche.pilotes?.some(
                            (oldPilote) => finalPilote.nom === oldPilote.nom
                          )
                      )
                      .map((pilote) => ({
                        ficheId: fiche.id,
                        userId: pilote.userId,
                        tagId: pilote.tagId,
                      })) ?? [];

                  if (pilotesToAdd.length > 0) {
                    addPilotes(pilotesToAdd);
                  }

                  const pilotesToRemove =
                    initialFiche.pilotes
                      ?.filter(
                        (oldPilote) =>
                          !fiche.pilotes?.some(
                            (finalPilote) => finalPilote.nom === oldPilote.nom
                          )
                      )
                      .map((pilote) => ({
                        ficheId: fiche.id,
                        userId: pilote.userId,
                        tagId: pilote.tagId,
                      })) ?? [];
                  if (pilotesToRemove.length > 0) {
                    const pilotesTag = pilotesToRemove.filter(
                      (pilote) => pilote.tagId
                    );
                    if (pilotesTag.length > 0) {
                      removeTagPilotes(pilotesTag);
                    }
                    const pilotesUser = pilotesToRemove.filter(
                      (pilote) => pilote.userId
                    );
                    removeUserPilotes(pilotesUser);
                  }
                  updateFiche({ ficheId: fiche.id, ficheFields: fiche });
                  close();
                },
              }}
              btnCancelProps={{ onClick: close }}
            />
          </div>
        );
      }}
    />
  );
};

export default ModifierFicheModale;
