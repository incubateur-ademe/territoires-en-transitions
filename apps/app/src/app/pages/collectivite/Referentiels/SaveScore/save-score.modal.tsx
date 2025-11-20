import { useSaveSnapshot } from '@/app/app/pages/collectivite/Referentiels/SaveScore/useSaveScore';
import { getIsoFormattedDate } from '@/app/utils/formatUtils';
import { ReferentielId } from '@tet/domain/referentiels';
import {
  Alert,
  ButtonGroup,
  Event,
  Field,
  Input,
  Modal,
  ModalFooterOKCancel,
  useEventTracker,
} from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { DateTime } from 'luxon';
import { useRef, useState } from 'react';

const generateBeforeDate = (
  date: string | null | undefined
): string | undefined => {
  if (!date) return undefined;

  const result = DateTime.fromISO(date, { zone: 'Europe/Paris' })
    .set({ hour: 23, minute: 59, second: 0 })
    .toUTC()
    .toISO();

  return result ?? undefined;
};

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
        date: dateVersion ? generateBeforeDate(dateVersion) : undefined,
      },
      {
        onSettled: () => {
          openState.setIsOpen(false);
        },
      }
    );
  };

  return (
    <>
      <Modal
        title="Figer l'état des lieux"
        size="md"
        openState={openState}
        render={({ descriptionId }) => (
          <div id={descriptionId} className="space-y-6">
            {/*Info */}
            <Alert
              description="Vous pouvez figer les scores et textes renseignés dans le référentiel à la fin de l'état des lieux initial (ex: Etat-des-lieux-initial) ou à un autre moment clé (ex: pre-visite-annuelle), etc.
Une sauvegarde sera automatiquement réalisée lors du démarrage d'un audit et lors de la clôture d'un audit. Une sauvegarde sera également prochainement proposée lors du dépôt du rapport de visite annuelle."
              rounded
            />
            {/* Choix entre 'Date d'aujourd'hui' et 'A une date antérieure' */}
            <ButtonGroup
              size="xs"
              buttons={[
                {
                  children: `Date d'aujourd'hui`,
                  id: 'now',
                  onClick: () => {
                    setSelectedButton('now');
                    setDateVersion('');
                  },
                },
                {
                  children: `À une date antérieure`,
                  id: 'before',
                  onClick: () => setSelectedButton('before'),
                },
              ]}
              fillContainer
              activeButtonId={selectedButton}
            />
            {/* Date de la version à figer */}
            {selectedButton === 'before' && (
              <Field title="Date de la version à figer">
                <Input
                  type="date"
                  max={getIsoFormattedDate('')}
                  ref={ref}
                  value={dateVersion}
                  onChange={(e) => setDateVersion(e.target.value)}
                />
              </Field>
            )}
            {/* Nom de la version à enregistrer */}
            <Field title="Nom de la version à enregistrer">
              <div className="flex items-center border border-grey-4 rounded-lg bg-grey-1 focus-within:border-primary-5">
                <span className="text-sm px-3 py-3 text-primary-7 border-r border-grey-4">
                  {displayedYear} -
                </span>
                <Input
                  type="text"
                  placeholder="Entrez le nom de la version"
                  containerClassname="flex-grow border-none"
                  value={nomVersion}
                  onChange={(e) => setNomVersion(e.target.value)}
                />
              </div>
            </Field>
          </div>
        )}
        renderFooter={({ close }) => (
          <ModalFooterOKCancel
            btnCancelProps={{ onClick: close }}
            btnOKProps={{
              children: `Figer l'état des lieux`,
              onClick: () => {
                // tracker('referentiels:scores:sauvegarde', {
                //   collectiviteId,
                //   niveauAcces,
                //   role,
                //   dateDuJour: selectedButton === 'now',
                // });
                handleSave();
                tracker(Event.saveScore, {
                  dateDuJour: selectedButton === 'now',
                  dateVersion,
                });
                close();
              },
            }}
          />
        )}
      />
    </>
  );
};
