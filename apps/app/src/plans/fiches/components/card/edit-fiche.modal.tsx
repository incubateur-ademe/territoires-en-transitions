import { useIsPlanSuiviEnabled } from '@/app/plans/plans/suivi-plan/use-is-plan-suivi-enabled';
import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { appLabels } from '@/app/labels/catalog';
import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { JaugeFigeeAlert } from '@/app/plans/fiches/show-fiche/content/details/jauge/jauge-figee.alert';
import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import { JaugeBadge } from '@/app/plans/shared/jauge/jauge.badge';
import { JaugeSlider } from '@/app/plans/shared/jauge/jauge.slider';
import PrioritesSelectDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesSelectDropdown';
import StatutsSelectDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import { getIsoFormattedDate } from '@/app/utils/formatUtils';
import {
  applyJaugeStatutChange,
  FICHE_TITRE_MAX_LENGTH,
  isJaugeFigee,
  JaugeStatut,
} from '@tet/domain/plans';
import {
  Checkbox,
  Event,
  Field,
  FormSectionGrid,
  Input,
  ModalFooterOKCancel,
  useEventTracker,
} from '@tet/ui';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { BaseUpdateFicheModal } from './base-update-fiche.modal';

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
  const [jaugeEnCours, setJaugeEnCours] = useState<number | null>(null);

  const isSousAction = initialFiche.parentId !== null;
  const isPlanSuiviEnabled = useIsPlanSuiviEnabled();
  const showJauge = !isSousAction && isPlanSuiviEnabled;

  const changeJaugeStatut = (change: Partial<JaugeStatut>) => {
    const result = applyJaugeStatutChange({
      before: { statut: fiche.statut, jauge: fiche.jauge },
      change,
      isSousAction,
    });
    if (result.success) setFiche({ ...fiche, ...result.data });
  };

  const refDateDebut = useRef<HTMLInputElement>(null);
  const refDateFin = useRef<HTMLInputElement>(null);

  return (
    <BaseUpdateFicheModal
      fiche={initialFiche}
      dataTest="ModifierFicheModale"
      size="lg"
      openState={{
        isOpen,
        setIsOpen,
      }}
      onClose={() => setFiche(initialFiche)}
      title={appLabels.modifierAction}
      render={({ close }) => {
        const prioriteField = (
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
        );

        return (
          <div className="flex flex-col gap-6">
            <Field title={appLabels.champNomAction}>
              <Input
                data-test="FicheNomInput"
                type="text"
                value={fiche.titre ?? undefined}
                onChange={(e) => setFiche({ ...fiche, titre: e.target.value })}
                maxLength={FICHE_TITRE_MAX_LENGTH}
                placeholder={appLabels.sansTitre}
                autoFocus
              />
            </Field>
            <FormSectionGrid>
              <Field title={appLabels.ficheStatut}>
                <StatutsSelectDropdown
                  values={fiche.statut}
                  onChange={(statut) =>
                    changeJaugeStatut({ statut: statut ?? null })
                  }
                />
              </Field>
              {!showJauge ? (
                prioriteField
              ) : (
                <Field title={appLabels.ficheJauge}>
                  <div className="flex items-center gap-3 h-10">
                    <JaugeBadge
                      value={jaugeEnCours ?? fiche.jauge}
                      statut={fiche.statut}
                      jaugeModifiedAt={fiche.jaugeModifiedAt}
                      isDisabled={isJaugeFigee(fiche.statut)}
                      isLarge
                    />
                    <JaugeSlider
                      ariaLabel={appLabels.ficheJauge}
                      value={jaugeEnCours ?? fiche.jauge}
                      isDisabled={isJaugeFigee(fiche.statut)}
                      className="flex-1"
                      onValueChange={setJaugeEnCours}
                      onValueCommit={(jauge) => {
                        setJaugeEnCours(null);
                        changeJaugeStatut({ jauge });
                      }}
                      dataTest="ModifierFicheModale.jauge"
                    />
                  </div>
                </Field>
              )}
            </FormSectionGrid>
            {showJauge && isJaugeFigee(fiche.statut) && (
              <JaugeFigeeAlert statut={fiche.statut} />
            )}
            {showJauge && prioriteField}
            <Field title={appLabels.personnePilote()}>
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
            <ModalFooterOKCancel
              btnOKProps={{
                onClick: () => {
                  updateFiche({
                    ficheId: fiche.id,
                    ficheFields: {
                      titre: fiche.titre,
                      statut: fiche.statut,
                      priorite: fiche.priorite,
                      pilotes: fiche.pilotes,
                      dateDebut: fiche.dateDebut,
                      dateFin: fiche.dateFin,
                      ameliorationContinue: fiche.ameliorationContinue,
                      ...(fiche.jauge !== initialFiche.jauge && {
                        jauge: fiche.jauge,
                      }),
                    },
                  });
                  tracker(Event.fiches.updateModaleValidation);
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
