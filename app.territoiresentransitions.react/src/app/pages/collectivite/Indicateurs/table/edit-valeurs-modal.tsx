import { Button, Divider, Field, Input, Modal, ModalFooter } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import { PreparedData } from '../data/prepare-data';
import { IndicateurSourceValeur } from '../data/use-indicateur-valeurs';
import { useUpsertIndicateurValeur } from '../data/use-upsert-indicateur-valeur';
import { TIndicateurDefinition } from '../types';
import { InputValue } from './input-value';

export type EditValeursModalProps = {
  collectiviteId: number;
  definition: TIndicateurDefinition;
  openState: OpenState;
  data: PreparedData;
};

/**
 * Affiche la modale d'édition des valeurs d'un indicateur
 */
export const EditValeursModal = (props: EditValeursModalProps) => {
  const { collectiviteId, data, definition, openState } = props;
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

  return (
    <Modal
      size="lg"
      openState={openState}
      title="Compléter le tableau"
      render={() => {
        return (
          <>
            <Field title="Année *">
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

            <Field title="Résultat" className="-mt-8">
              <InputValue
                value={resultat ?? ''}
                onChange={(value) => setValeur({ ...valeur, resultat: value })}
              />
            </Field>
            <Field title="Ajouter un commentaire sur le résultat">
              <Input
                type="text"
                value={resultatCommentaire ?? ''}
                onChange={(e) =>
                  setValeur({ ...valeur, resultatCommentaire: e.target.value })
                }
              />
            </Field>

            <Divider />

            <Field title="Objectif" className="-mt-8">
              <InputValue
                value={objectif ?? ''}
                onChange={(value) => setValeur({ ...valeur, objectif: value })}
              />
            </Field>
            <Field title="Ajouter un commentaire sur l’objectif">
              <Input
                type="text"
                value={objectifCommentaire ?? ''}
                onChange={(e) =>
                  setValeur({ ...valeur, objectifCommentaire: e.target.value })
                }
              />
            </Field>
          </>
        );
      }}
      renderFooter={({ close }) => (
        <ModalFooter>
          <Button variant="outlined" onClick={close}>
            Annuler
          </Button>
          <Button
            disabled={disabled}
            onClick={() => {
              upsert();
              // pré-rempli le champ avec l'année suivante
              const anneeSuivante = annee ? annee + 1 : null;
              setAnnee(anneeSuivante);
              // pré-rempli (ou reset) les autres champs avec les valeurs existantes
              const valeurExistante = getValeurExistante(anneeSuivante);
              setValeur(valeurExistante ? valeurExistante : {});
            }}
          >
            Valider et ajouter une année
          </Button>
          <Button
            disabled={disabled}
            onClick={() => {
              upsert();
              close();
            }}
          >
            Valider
          </Button>
        </ModalFooter>
      )}
    />
  );
};
