import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpsertIndicateurValeur } from '@/app/indicateurs/valeurs/use-upsert-indicateur-valeur';
import { appLabels } from '@/app/labels/catalog';
import { getIndicateurPeriodPresentation } from '@/app/indicateurs/valeurs/indicateur-period-presentation';
import {
  Button,
  Divider,
  Field,
  FieldMessage,
  Input,
  Modal,
  ModalFooter,
  Textarea,
} from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import { IndicateurPeriod, IndicateurPeriods } from '@tet/domain/indicateurs';
import { IndicateurSourceValeur, PreparedData } from '../data/prepare-data';
import { InputValue } from './input-value';

type EditValeursModalProps = {
  collectiviteId: number;
  definition: Pick<IndicateurDefinition, 'id' | 'periodicite'>;
  openState: OpenState;
  data: PreparedData;
  title?: string;
};

/**
 * Affiche la modale d'édition des valeurs d'un indicateur
 */
export const EditValeursModal = (props: EditValeursModalProps) => {
  const { collectiviteId, data, definition, openState, title } = props;
  const { valeursExistantes } = data;

  const { mutateAsync: upsertValeur, isPending } = useUpsertIndicateurValeur();
  const [valeur, setValeur] = useState<Partial<IndicateurSourceValeur>>({});
  const [periode, setPeriode] = useState('');
  const { objectif, objectifCommentaire, resultat, resultatCommentaire } =
    valeur || {};
  const periodicite = definition.periodicite;
  const presentation = getIndicateurPeriodPresentation(periodicite);
  let periodeValide: IndicateurPeriod | null = null;
  try {
    periodeValide = IndicateurPeriods.parse(periodicite, periode);
  } catch {
    // L'erreur est reflétée par l'état désactivé des boutons de validation.
  }
  let periodeSuivante: IndicateurPeriod | null = null;
  if (periodeValide) {
    try {
      periodeSuivante = IndicateurPeriods.next(periodeValide);
    } catch {
      // La dernière période du calendrier reste enregistrable, mais aucune
      // nouvelle saisie ne peut être préparée au-delà de cette borne.
    }
  }

  const disabled =
    !periodeValide ||
    !(typeof objectif === 'number' || typeof resultat === 'number') ||
    isPending;

  const upsert = async (): Promise<boolean> => {
    if (!periodeValide) return false;
    try {
      await upsertValeur({
        id: valeur.id,
        collectiviteId,
        indicateurId: definition.id,
        dateValeur: IndicateurPeriods.toDateValeur(periodeValide),
        resultat,
        resultatCommentaire,
        objectif,
        objectifCommentaire,
      });
      return true;
    } catch {
      // Le hook de mutation affiche déjà l'erreur. Conserver le formulaire
      // ouvert permet de corriger ou de retenter la saisie.
      return false;
    }
  };

  // cherche si il existe déjà une valeur
  const getValeurExistante = (candidate: string) => {
    try {
      const validCandidate = IndicateurPeriods.parse(periodicite, candidate);
      const candidateKey = IndicateurPeriods.key(validCandidate);
      return valeursExistantes.find(
        (v) => IndicateurPeriods.key(v.periode) === candidateKey
      );
    } catch {
      return undefined;
    }
  };

  const changePeriode = (candidate: string) => {
    setPeriode(candidate);
    setValeur(getValeurExistante(candidate) ?? {});
  };

  const validateAndAddNewValue = async () => {
    if (!periodeValide || !periodeSuivante) return;
    if (!(await upsert())) return;
    // pré-remplit le champ avec la période suivante
    const periodeSuivanteInput = IndicateurPeriods.serialize(periodeSuivante);
    changePeriode(periodeSuivanteInput);
  };

  return (
    <Modal
      size="lg"
      openState={openState}
      title={title || appLabels.completerTableau}
      render={() => {
        return (
          <div className="flex flex-col gap-8">
            <Field title={presentation.editor.fieldLabel}>
              <Input
                type={presentation.editor.inputType}
                inputMode={presentation.editor.inputMode}
                value={periode}
                onChange={(e) => changePeriode(e.target.value)}
              />
            </Field>

            <Divider />

            <Field title={capitalize(appLabels.indicateurResultat())}>
              <InputValue
                value={resultat ?? ''}
                onChange={(value) => setValeur({ ...valeur, resultat: value })}
              />
            </Field>
            <Field title={appLabels.champAjouterCommentaireResultat}>
              <Textarea
                value={resultatCommentaire ?? ''}
                onChange={(e) =>
                  setValeur({ ...valeur, resultatCommentaire: e.target.value })
                }
              />
            </Field>

            <Divider />

            <Field title={capitalize(appLabels.indicateurObjectif())}>
              <InputValue
                value={objectif ?? ''}
                onChange={(value) => setValeur({ ...valeur, objectif: value })}
              />
            </Field>
            <Field title={appLabels.champAjouterCommentaireObjectif}>
              <Textarea
                value={objectifCommentaire ?? ''}
                onChange={(e) =>
                  setValeur({ ...valeur, objectifCommentaire: e.target.value })
                }
              />
            </Field>
            {!disabled && (
              <FieldMessage
                state="info"
                message={appLabels.confirmDeleteAstuceEntree}
              />
            )}
          </div>
        );
      }}
      renderFooter={({ close }) => (
        <ModalFooter>
          <Button variant="outlined" onClick={close}>
            {appLabels.annuler}
          </Button>
          <Button
            disabled={disabled || !periodeSuivante}
            onClick={() => void validateAndAddNewValue()}
          >
            {presentation.editor.validateAndAddLabel}
          </Button>
          <Button
            disabled={disabled}
            onClick={() => {
              void upsert().then((saved) => {
                if (saved) {
                  close();
                }
              });
            }}
          >
            {appLabels.valider}
          </Button>
        </ModalFooter>
      )}
    />
  );
};
