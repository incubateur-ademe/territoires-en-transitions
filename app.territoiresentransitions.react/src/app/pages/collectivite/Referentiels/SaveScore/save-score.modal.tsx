import { useSaveScore } from '@/app/app/pages/collectivite/Referentiels/SaveScore/useSaveScore';
import { useBaseToast } from '@/app/core-logic/hooks/useBaseToast';
import { getIsoFormattedDate } from '@/app/utils/formatUtils';
import { Alert, Button, ButtonGroup, Field, Input, Modal } from '@/ui';
import { ReactNode, useRef, useState } from 'react';
import { ReferentielId } from '../../../../../../../backend/src/referentiels/index-domain';


export type SaveScoreProps = {
  referentielId: string;
  collectiviteId: number;
};

const generateBeforeDate = (date: string) => {
  const dateObject = new Date(date);
  dateObject.setHours(23, 59, 0);
  return dateObject.toISOString();
};

const SaveScoreModal = ({
  referentielId,
  collectiviteId,
  children,
}: SaveScoreProps & {
  children: ReactNode;
}) => {
  const [selectedButton, setSelectedButton] = useState<string>('now');
  const [nomVersion, setNomVersion] = useState<string | undefined>();
  const [dateVersion, setDateVersion] = useState<string | undefined>();
  const { renderToast, setToast } = useBaseToast();
  const tracker = useEventTracker('app/referentiel');
  const { niveauAcces, role } = useCurrentCollectivite()!;

  const ref = useRef<HTMLInputElement>(null);

  const getDisplayedYear = (): string => {
    if (selectedButton === 'before' && dateVersion) {
      return new Date(dateVersion).getFullYear().toString();
    }
    return new Date().getFullYear().toString();
  };

  const finalNomVersion = `${getDisplayedYear()} - ${nomVersion?.trim()}`;


  const { mutate: upsertSnapshot, isPending: isSaving, isSuccess } = useSaveScore();

  const handleSave = async (close: () => void) => {
    if (!nomVersion?.trim()) return;

    upsertSnapshot({
      collectiviteId,
      referentiel: referentielId as ReferentielId,
      snapshotNom: finalNomVersion,
      date: dateVersion ? generateBeforeDate(dateVersion) : undefined
    }, {} );

    /*
    if (result.error) {
      if (result.error.message.includes('existe déjà')) {
        setToast(
          'error',
          `Une sauvegarde du référentiel à la date ${
            dateVersion ? dateVersion : `d'aujourd'hui`
          } ou/et avec le nom "${nomVersion}" existe déjà.`,
          5000
        );
      } else {
        setToast('error', `Erreur lors de la sauvegarde`, 5000);
      }
    }
    if (result.isSuccess) {
      setToast('success', 'Référentiel sauvegardé', 5000);
      close();
    }*/
  };

  return (
    <>
      {renderToast()}
      <Modal
        title="Figer le référentiel"
        size="md"
        render={({ descriptionId, close }) => (
          <div id={descriptionId} className="space-y-6">
            {/*Info */}
            <Alert
              description="Une sauvegarde sera automatiquement réalisée lors du démarrage d'un audit et lors de la clôture d'un audit.
          Une sauvegarde sera proposée lors du dépôt du rapport de visite annuelle.
          Vous pouvez figer le référentiel à la fin de l'état des lieux initial (ex: Etat-des-lieux-initial) ou à un autre moment clé (ex: pre-visite-annuelle), etc."
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
                    setDateVersion(undefined);
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
                  {getDisplayedYear()} -
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
              <Button variant="grey" size="sm" onClick={close}>
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
                  handleSave(close);
                }}
              >
                {isSaving ? 'Sauvegarde en cours...' : 'Figer cette version'}
              </Button>
            </div>
          </div>
        )}
      >
        {children as React.ReactElement}
      </Modal>
    </>
  );
};

export default SaveScoreModal;
