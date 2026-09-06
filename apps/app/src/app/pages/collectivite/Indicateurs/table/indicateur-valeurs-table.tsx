import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpsertIndicateurValeur } from '@/app/indicateurs/valeurs/use-upsert-indicateur-valeur';
import PictoIndicateurVide from '@/app/ui/pictogrammes/PictoIndicateurVide';
import {
  Button,
  DEPRECATED_Table,
  DEPRECATED_TBody,
  DEPRECATED_TCell,
  DEPRECATED_TRow,
} from '@tet/ui';
import {
  formatIndicateurPeriod,
  IndicateurPeriod,
  IndicateurPeriods,
} from '@tet/domain/indicateurs';
import { useState } from 'react';
import { PreparedData, PreparedValue } from '../data/prepare-data';
import { useDeleteIndicateurValeur } from '../data/use-delete-indicateur-valeur';
import { useGetColorBySourceId } from '../data/use-indicateur-sources';
import { SourceType } from '../types';
import { CellPeriodeList } from './cell-periode-list';
import { CellSourceName } from './cell-source-name';
import { CellValue } from './cell-value';
import { ConfirmDelete } from './confirm-delete';
import { EditCommentaireModal } from './edit-commentaire-modal';
import { shouldConfirmValueDeletion } from './indicateur-valeur-deletion.rules';

// nombre maximum de colonnes vides à afficher
const MAX_PLACEHOLDERS_COUNT = 5;

type IndicateurValeursTable = {
  collectiviteId: number;
  definition: IndicateurDefinition;
  readonly?: boolean;
  confidentiel?: boolean;
  data: PreparedData | null;
  type: SourceType;
  disableComments: boolean;
};

const isSamePeriod = (
  left: IndicateurPeriod,
  right: IndicateurPeriod
): boolean => IndicateurPeriods.key(left) === IndicateurPeriods.key(right);

/**
 * Affiche le tableau des valeurs d'un indicateur pour un type (objectif | résultat) donné
 */
export const IndicateurValeursTable = ({
  collectiviteId,
  definition,
  data,
  type,
  readonly,
  confidentiel,
  disableComments,
}: IndicateurValeursTable) => {
  const { periodes, sources, donneesCollectivite, valeursExistantes } =
    data || {};
  const placeholdersCount = Math.max(
    0,
    MAX_PLACEHOLDERS_COUNT - (periodes?.length ?? 0)
  );

  const [commentaireValeur, setCommentaireValeur] = useState<null | {
    id?: number;
    periode: IndicateurPeriod;
    periodeLabel: string;
    commentaire?: string | null;
  }>(null);
  const [toBeDeleted, setToBeDeleted] = useState<PreparedValue | null>(null);

  const { mutate: upsertValeur } = useUpsertIndicateurValeur();
  const { mutate: deleteValeur } = useDeleteIndicateurValeur();

  const getColorBySourceId = useGetColorBySourceId();

  return (
    <>
      <DEPRECATED_Table>
        <DEPRECATED_TBody>
          <DEPRECATED_TRow className="bg-primary-2 border-b-2 border-primary-4">
            <DEPRECATED_TCell className="bg-white">&nbsp;</DEPRECATED_TCell>
            {/* colonnes pour chaque période */}
            {data && (
              <CellPeriodeList
                data={data}
                confidentiel={confidentiel}
                readonly={readonly}
                type={type}
                onDelete={(valeur) => {
                  // demande confirmation avant de supprimer
                  if (shouldConfirmValueDeletion(valeur)) {
                    setToBeDeleted(valeur);
                  } else {
                    // sauf pour les lignes n'ayant ni valeur ni commentaire
                    deleteValeur({
                      collectiviteId,
                      indicateurId: definition.id,
                      id: valeur.id,
                    });
                  }
                }}
              />
            )}
            {/** placeholders */}
            {!!placeholdersCount &&
              Array.from({ length: placeholdersCount }).map((_, i) => (
                <PlaceholderColumn
                  key={i}
                  rowSpan={(sources?.length ?? 0) + 2}
                />
              ))}
          </DEPRECATED_TRow>
          {/* lignes pour chaque source */}
          {sources?.map((s) => (
            <DEPRECATED_TRow key={s.source}>
              {/* nom de la source et rappel de l'unité */}
              <CellSourceName
                source={s}
                type={type}
                unite={definition.unite}
                getColorBySourceId={getColorBySourceId}
              />
              {/* cellule pour chaque période */}
              {periodes?.map((periode) => {
                const entry = s.valeurs.find((v) =>
                  isSamePeriod(v.periode, periode)
                );
                // récupère l'id de la ligne à mettre à jour
                const id =
                  (s.source === 'collectivite'
                    ? valeursExistantes?.find((v) =>
                        isSamePeriod(v.periode, periode)
                      )?.id
                    : undefined) ?? undefined;
                return (
                  <CellValue
                    key={IndicateurPeriods.key(periode)}
                    readonly={readonly || s.source !== 'collectivite'}
                    value={entry?.valeur ?? ''}
                    onChange={(newValue) => {
                      upsertValeur({
                        id,
                        collectiviteId,
                        indicateurId: definition.id,
                        dateValeur: IndicateurPeriods.toDateValeur(periode),
                        [type]: newValue,
                      });
                    }}
                  />
                );
              })}
            </DEPRECATED_TRow>
          ))}
          {/* ligne pour les boutons "commentaire" */}
          {!disableComments && (
            <DEPRECATED_TRow>
              <DEPRECATED_TCell>&nbsp;</DEPRECATED_TCell>
              {periodes?.map((periode) => {
                const entry = donneesCollectivite?.valeurs.find((v) =>
                  isSamePeriod(v.periode, periode)
                );

                const commentaire = entry?.commentaire ?? '';

                return (
                  <DEPRECATED_TCell key={IndicateurPeriods.key(periode)}>
                    <div className="flex justify-center">
                      <Button
                        size="xs"
                        variant="outlined"
                        icon="question-answer-fill"
                        disabled={!commentaire && readonly}
                        notification={commentaire ? { number: 1 } : undefined}
                        onClick={() =>
                          setCommentaireValeur(
                            entry ?? {
                              periode,
                              periodeLabel: formatIndicateurPeriod(periode),
                            }
                          )
                        }
                      />
                    </div>
                  </DEPRECATED_TCell>
                );
              })}
            </DEPRECATED_TRow>
          )}
        </DEPRECATED_TBody>
      </DEPRECATED_Table>
      {commentaireValeur && (
        <EditCommentaireModal
          periodeLabel={commentaireValeur.periodeLabel}
          type={type}
          definition={definition}
          commentaire={commentaireValeur.commentaire ?? ''}
          openState={{
            isOpen: true,
            setIsOpen: () => setCommentaireValeur(null),
          }}
          onChange={(newComment) => {
            upsertValeur({
              id: commentaireValeur?.id,
              collectiviteId,
              indicateurId: definition.id,
              dateValeur: IndicateurPeriods.toDateValeur(
                commentaireValeur.periode
              ),
              [`${type}Commentaire`]: newComment,
            });
          }}
          isReadonly={readonly}
        />
      )}
      {toBeDeleted && (
        <ConfirmDelete
          valeur={toBeDeleted}
          unite={definition.unite}
          onDismissConfirm={(confirmed) => {
            if (confirmed) {
              deleteValeur({
                collectiviteId,
                indicateurId: definition.id,
                id: toBeDeleted.id,
              });
            }
            setToBeDeleted(null);
          }}
        />
      )}
    </>
  );
};

// affiche une colonne vide
const PlaceholderColumn = ({ rowSpan }: { rowSpan: number }) => (
  <td
    rowSpan={rowSpan}
    className="min-w-40 bg-primary-0 border-l border-primary-4 text-primary-9 text-xs"
  >
    <div className="w-full h-full flex items-center justify-center">
      <PictoIndicateurVide className="w-16 h-16" />
    </div>
  </td>
);
