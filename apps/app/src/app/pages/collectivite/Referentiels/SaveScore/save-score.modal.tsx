import { useSaveSnapshot } from '@/app/app/pages/collectivite/Referentiels/SaveScore/useSaveScore';
import { appLabels } from '@/app/labels/catalog';
import { getIsoFormattedDate } from '@/app/utils/formatUtils';
import { ReferentielId } from '@tet/domain/referentiels';
import {
  Alert,
  ButtonGroup,
  Event,
  Field,
  Input,
  useEventTracker,
} from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { OpenState } from '@tet/ui/utils/types';
import { useRef, useState } from 'react';

const getDisplayedYear = (
  selectedButton: string,
  dateVersion: string | undefined
): string => {
  if (selectedButton === 'before' && dateVersion) {
    return new Date(dateVersion).getFullYear().toString();
  }
  return new Date().getFullYear().toString();
};

export type SaveScoreProps = {
  referentielId: ReferentielId;
  collectiviteId: number;
};

export const SaveScoreModal = ({
  referentielId,
  collectiviteId,
  openState,
  when = 'now',
}: SaveScoreProps & {
  openState: OpenState;
  when?: 'now' | 'before';
}) => {
  const [selectedButton, setSelectedButton] = useState<string>(when);
  const tracker = useEventTracker();
  const [nomVersion, setNomVersion] = useState<string>('');
  const [dateVersion, setDateVersion] = useState<string>('');

  const ref = useRef<HTMLInputElement>(null);

  const displayedYear = getDisplayedYear(selectedButton, dateVersion);
  const finalNomVersion = `${displayedYear} - ${nomVersion?.trim()}`;

  const { mutate: saveSnapshot } = useSaveSnapshot();

  const handleSave = async () => {
    if (!nomVersion.trim()) return;

    saveSnapshot(
      {
        collectiviteId,
        referentielId,
        nom: finalNomVersion,
        date: dateVersion === '' ? undefined : dateVersion,
      },
      {
        onSettled: () => {
          openState.setIsOpen(false);
        },
      }
    );
  };

  return (
    <Modal
      openState={{ isOpen: openState.isOpen, setIsOpen: openState.setIsOpen }}
      size="md"
    >
      <Modal.Header>
        <Modal.Title>{appLabels.figerEtatDesLieux}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="space-y-6">
          <Alert
            description="Vous pouvez figer les scores et textes renseignés dans le référentiel à la fin de l'état des lieux initial (ex: Etat-des-lieux-initial) ou à un autre moment clé (ex: pre-visite-annuelle), etc.
Une sauvegarde sera automatiquement réalisée lors du démarrage d'un audit et lors de la clôture d'un audit. Une sauvegarde sera également prochainement proposée lors du dépôt du rapport de visite annuelle."
          />
          <ButtonGroup
            size="xs"
            buttons={[
              {
                children: appLabels.dateAujourdhui,
                id: 'now',
                onClick: () => {
                  setSelectedButton('now');
                  setDateVersion('');
                },
              },
              {
                children: appLabels.dateAnterieure,
                id: 'before',
                onClick: () => setSelectedButton('before'),
              },
            ]}
            fillContainer
            activeButtonId={selectedButton}
          />
          {selectedButton === 'before' && (
            <Field title={appLabels.dateVersionAFiger}>
              <Input
                type="date"
                max={getIsoFormattedDate('')}
                ref={ref}
                value={dateVersion}
                onChange={(e) => setDateVersion(e.target.value)}
              />
            </Field>
          )}
          <Field title={appLabels.nomVersionAEnregistrer}>
            <div className="flex items-center border border-grey-4 rounded-lg bg-grey-1 focus-within:border-primary-5">
              <span className="text-sm px-3 py-3 text-primary-7 border-r border-grey-4">
                {displayedYear} -
              </span>
              <Input
                type="text"
                placeholder={appLabels.entrezNomVersion}
                containerClassname="flex-grow border-none"
                value={nomVersion}
                onChange={(e) => setNomVersion(e.target.value)}
              />
            </div>
          </Field>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        <Modal.Ok
          onClick={() => {
            handleSave();
            tracker(Event.saveScore, {
              dateDuJour: selectedButton === 'now',
              dateVersion,
            });
          }}
        >
          {appLabels.figerEtatDesLieux}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};
