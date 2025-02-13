import { RouterInput } from '@/api/utils/trpc/client';
import { useSaveScore } from '@/app/app/pages/collectivite/Referentiels/SaveScore/useSaveScore';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { getIsoFormattedDate } from '@/app/utils/formatUtils';
import {
  Alert,
  Button,
  ButtonGroup,
  Field,
  Input,
  Modal,
  useEventTracker,
} from '@/ui';
import { OpenState } from '@/ui/utils/types';
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

type ComputeScoreType = RouterInput['referentiels']['scores']['computeScore'];

export type SaveScoreProps = {
  referentielId: string;
  collectiviteId: number;
};

const SaveScoreModal = ({
  referentielId,
  collectiviteId,
  openState,
}: SaveScoreProps & {
  openState: OpenState;
}) => {
  const [selectedButton, setSelectedButton] = useState<string>('now');
  const tracker = useEventTracker('app/referentiel');
  const { niveauAcces, role } = useCurrentCollectivite()!;
  const [nomVersion, setNomVersion] = useState<string>('');
  const [dateVersion, setDateVersion] = useState<string>('');

  const ref = useRef<HTMLInputElement>(null);

  const displayedYear = getDisplayedYear(selectedButton, dateVersion);
  const finalNomVersion = `${displayedYear} - ${nomVersion?.trim()}`;

  const { mutate: upsertSnapshot, isPending: isSaving } = useSaveScore();

  const handleSave = async () => {
    if (!nomVersion.trim()) return;

    upsertSnapshot(
      {
        collectiviteId,
        referentiel: referentielId as ComputeScoreType['referentielId'],
        snapshotNom: finalNomVersion,
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
            {/* Boutons annuler et valider */}
            <div className="flex gap-4 justify-end">
              <Button
                variant="grey"
                size="sm"
                onClick={() => openState.setIsOpen(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={
                  isSaving ||
                  !nomVersion?.trim() ||
                  (selectedButton !== 'now' && !dateVersion)
                }
                onClick={() => {
                  tracker('referentiels:scores:sauvegarde', {
                    collectiviteId,
                    niveauAcces,
                    role,
                    dateDuJour: selectedButton === 'now',
                  });
                  handleSave();
                }}
              >
                {isSaving ? 'Sauvegarde en cours...' : 'Figer cette version'}
              </Button>
            </div>
          </div>
        )}
      />
    </>
  );
};

export default SaveScoreModal;
