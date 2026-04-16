import { appLabels } from '@/app/labels/catalog';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpsertIndicateurValeur } from '@/app/indicateurs/valeurs/use-upsert-indicateur-valeur';
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
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
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

  const { mutate: upsertValeur, isPending } = useUpsertIndicateurValeur();
  const [valeur, setValeur] = useState<Partial<IndicateurSourceValeur>>({});
  const [annee, setAnnee] = useState<number | null>(null);
  const { objectif, objectifCommentaire, resultat, resultatCommentaire } =
    valeur || {};

  const disabled =
    !annee ||
    !(typeof objectif === 'number' || typeof resultat === 'number') ||
    isPending;

  const upsert = () =>
    upsertValeur({
      id: valeur.id,
      collectiviteId,
      indicateurId: definition.id,
      dateValeur: `${annee}-01-01`,
      resultat,
      resultatCommentaire,
      objectif,
      objectifCommentaire,
    });

  // cherche si il existe déjà une valeur
  const getValeurExistante = (a: number | null) => {
    if (!a) return null;
    return valeursExistantes.find((v) => v.annee === a);
  };

  const validateAndAddNewValue = () => {
    upsert();
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
            <Field title={appLabels.champAnnee}>
              <Input
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

            <Field title={appLabels.champResultat}>
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

            <Field title={appLabels.champObjectif}>
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
          <Button disabled={disabled} onClick={validateAndAddNewValue}>
            {appLabels.validerAjouterAnnee}
          </Button>
          <Button
            disabled={disabled}
            onClick={() => {
              upsert();
              close();
            }}
          >
            {appLabels.valider}
          </Button>
        </ModalFooter>
      )}
    />
  );
};
