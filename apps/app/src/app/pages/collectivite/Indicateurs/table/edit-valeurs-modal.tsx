import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpsertIndicateurValeur } from '@/app/indicateurs/valeurs/use-upsert-indicateur-valeur';
import { appLabels } from '@/app/labels/catalog';
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
import { useId, useRef, useState } from 'react';
import { IndicateurPeriodes } from '@tet/domain/indicateurs';
import { IndicateurSourceValeur, PreparedData } from '../data/prepare-data';
import { InputValue } from './input-value';

export type EditValeursModalProps = {
  collectiviteId: number;
  definition: Pick<IndicateurDefinition, 'id'>;
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
  const fieldId = useId();
  const isSavingRef = useRef(false);

  const { mutateAsync: upsertValeur, isPending } = useUpsertIndicateurValeur();
  const [valeur, setValeur] = useState<Partial<IndicateurSourceValeur>>({});
  const [annee, setAnnee] = useState<number | null>(null);
  const { objectif, objectifCommentaire, resultat, resultatCommentaire } =
    valeur || {};

  const disabled =
    !annee ||
    !(typeof objectif === 'number' || typeof resultat === 'number') ||
    isPending;

  const upsert = async (): Promise<boolean> => {
    if (isSavingRef.current) return false;
    isSavingRef.current = true;

    try {
      await upsertValeur({
        id: valeur.id,
        collectiviteId,
        indicateurId: definition.id,
        dateValeur: `${annee}-01-01`,
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
    } finally {
      isSavingRef.current = false;
    }
  };

  // cherche si il existe déjà une valeur
  const getValeurExistante = (a: number | null) => {
    if (!a) return null;
    return valeursExistantes.find(
      (v) => Number(IndicateurPeriodes.serialize(v.periode)) === a
    );
  };

  const validateAndAddNewValue = async () => {
    if (!(await upsert())) return;
    // pré-rempli le champ avec l'année suivante
    const anneeSuivante = annee ? annee + 1 : null;
    setAnnee(anneeSuivante);
    // pré-rempli (ou reset) les autres champs avec les valeurs existantes
    const valeurExistante = getValeurExistante(anneeSuivante);
    setValeur(valeurExistante ? valeurExistante : {});
  };

  return (
    <Modal
      size="lg"
      openState={openState}
      title={title || appLabels.completerTableau}
      render={() => {
        return (
          <div className="flex flex-col gap-8">
            <Field title={appLabels.champAnnee} htmlFor={`${fieldId}-annee`}>
              <Input
                id={`${fieldId}-annee`}
                type="text"
                value={annee?.toString() ?? ''}
                onChange={(e) => {
                  const a = parseInt(e.target.value, 10);
                  setAnnee(isNaN(a) ? null : a);
                }}
                onBlur={() => {
                  const valeurExistante = getValeurExistante(annee);
                  if (valeurExistante) setValeur(valeurExistante);
                }}
              />
            </Field>

            <Divider />

            <Field
              title={capitalize(appLabels.indicateurResultat())}
              htmlFor={`${fieldId}-resultat`}
            >
              <InputValue
                id={`${fieldId}-resultat`}
                value={resultat ?? ''}
                onChange={(value) => setValeur({ ...valeur, resultat: value })}
              />
            </Field>
            <Field
              title={appLabels.champAjouterCommentaireResultat}
              htmlFor={`${fieldId}-resultat-commentaire`}
            >
              <Textarea
                id={`${fieldId}-resultat-commentaire`}
                value={resultatCommentaire ?? ''}
                onChange={(e) =>
                  setValeur({ ...valeur, resultatCommentaire: e.target.value })
                }
              />
            </Field>

            <Divider />

            <Field
              title={capitalize(appLabels.indicateurObjectif())}
              htmlFor={`${fieldId}-objectif`}
            >
              <InputValue
                id={`${fieldId}-objectif`}
                value={objectif ?? ''}
                onChange={(value) => setValeur({ ...valeur, objectif: value })}
              />
            </Field>
            <Field
              title={appLabels.champAjouterCommentaireObjectif}
              htmlFor={`${fieldId}-objectif-commentaire`}
            >
              <Textarea
                id={`${fieldId}-objectif-commentaire`}
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
            disabled={disabled}
            onClick={() => void validateAndAddNewValue()}
          >
            {appLabels.validerAjouterAnnee}
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
