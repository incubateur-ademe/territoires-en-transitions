'use client';

import { PeriodesTable } from '@/app/indicateurs/valeurs/periodes-table/periodes-table';
import type { SousIndicateursTableData } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table.rules';
import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { uniq } from 'es-toolkit';
import { useRef, useState, type JSX } from 'react';
import { prepareIndicateurPeriodeData } from '../../../data/prepare-indicateur-periode-data';
import { EditCommentaireModal } from '../../../table/edit-commentaire-modal';
import { countCommentaires } from '../../../table/indicateur-periode-commentaires.rules';
import { useIndicateurPeriodeDeclaration } from '../../../table/use-indicateur-periode-declaration';
import { useRevealIndicateurPeriode } from '../../../table/use-reveal-indicateur-periode';
import { ConfirmDeleteSousIndicateursPeriode } from '../../content/sous-indicateurs/confirm-delete-sous-indicateurs-periode';
import {
  LoadingState,
  StatusMessage,
} from '../../content/sous-indicateurs/sous-indicateurs-status';
import {
  hasValeursOnPeriode,
  toSousIndicateurTable,
} from '../../content/sous-indicateurs/to-sous-indicateur-table-rows';
import { useSousIndicateurRowsExpansion } from '../../content/sous-indicateurs/use-sous-indicateur-rows-expansion';
import { useIndicateurActions } from '../../context/indicateur-actions.context';
import { useIndicateurChart } from '../../context/indicateur-chart.context';
import { useIndicateurData } from '../../context/indicateur-data.context';
import { useIndicateurSousIndicateursTable } from '../../context/indicateur-sous-indicateurs-table.context';
import { toOpenDataRows } from './to-open-data-rows';
import {
  listGroupingRowKeys,
  toBlankedGroupingRows,
  toPredefiniAvecEnfantsTable,
} from './to-predefini-avec-enfants-table.rules';
import { toValeursPropresTable } from './to-valeurs-propres-table';

const NO_TOTALS = { withTotals: false } as const;
const NO_VALEURS_PROPRES = { periodes: [], rows: [] } as const;

const doNothing = (): void => undefined;

type ReadyTableProps = {
  isReadonly: boolean;
  collectiviteId: number;
  data: SousIndicateursTableData;
};

const ReadyTable = ({
  isReadonly,
  collectiviteId,
  data,
}: ReadyTableProps): JSX.Element => {
  const { indicateur } = useIndicateurData();
  const { chartInfo } = useIndicateurChart();
  const { saveValeur: saveValeurPropre } = useIndicateurActions();
  const {
    useSaveSousIndicateurValeur,
    useDeclareSousIndicateursPeriodes,
    useDeleteSousIndicateursPeriode,
    useIndicateurPeriodeCommentaires,
    useSousIndicateursOpenData,
  } = useIndicateurSousIndicateursTable();
  const saveValeur = useSaveSousIndicateurValeur();
  const declarePeriodes = useDeclareSousIndicateursPeriodes();
  const deletePeriode = useDeleteSousIndicateursPeriode();
  const commentaires = useIndicateurPeriodeCommentaires();
  const { periodicite } = indicateur;

  const resultats = prepareIndicateurPeriodeData(
    chartInfo.data.valeurs.resultats
  );
  const objectifs = prepareIndicateurPeriodeData(
    chartInfo.data.valeurs.objectifs
  );
  const valeursPropres = indicateur.sansValeurUtilisateur
    ? NO_VALEURS_PROPRES
    : toValeursPropresTable({
        resultats,
        objectifs,
        periodicite,
        canWrite: !isReadonly && chartInfo.sourceFilter.avecDonneesCollectivite,
        saveValeur: saveValeurPropre,
      });

  const { visibleRows, isExpanded, toggle } = useSousIndicateurRowsExpansion(
    data.rows
  );
  const indicateurIdsOfRows = uniq(data.rows.map((row) => row.indicateurId));
  const openData = useSousIndicateursOpenData(indicateurIdsOfRows);
  const enfants = toSousIndicateurTable({
    data,
    hasTotalRow: false,
    visibleRows,
    periodicite,
    collectiviteId,
    isReadonly,
    saveValeur,
    requestDetachSousIndicateur: undefined,
    renameSousIndicateur: undefined,
    focusedNameIndicateurId: null,
    onNameEditingEnd: doNothing,
    isExpanded,
    onToggle: toggle,
    parentValeursAreComputed: false,
    extraRows: (row) => {
      const openDataOfRow = openData.get(row.indicateurId);
      return openDataOfRow
        ? toOpenDataRows({ row, openData: openDataOfRow, periodicite })
        : [];
    },
  });
  const { periodes, rows: allRows } = toPredefiniAvecEnfantsTable({
    valeursPropres,
    enfants,
  });
  const rows = toBlankedGroupingRows({
    rows: allRows,
    groupingRowKeys: listGroupingRowKeys(data.rows),
  });

  const leafIndicateurIds = uniq(
    data.rows.filter((row) => !row.isExpandable).map((row) => row.indicateurId)
  );
  const declaration = useIndicateurPeriodeDeclaration({
    canWrite: !isReadonly,
    periodicite,
    existingPeriodes: periodes,
    declarePeriode: (periode) => declarePeriodes(leafIndicateurIds, [periode]),
    declarePeriodes: (newPeriodes) =>
      declarePeriodes(leafIndicateurIds, newPeriodes),
  });
  const periodeKeysWithValeursPropres = new Set(
    [...resultats.valeursExistantes, ...objectifs.valeursExistantes].map(
      ({ periode }) => IndicateurPeriodes.key(periode)
    )
  );
  const deletablePeriodeKeys = new Set([
    ...enfants.periodes.map(IndicateurPeriodes.key),
    ...periodeKeysWithValeursPropres,
  ]);
  const [periodeToDelete, setPeriodeToDelete] =
    useState<IndicateurPeriode | null>(null);
  const removePeriode = (periode: IndicateurPeriode): Promise<void> =>
    deletePeriode({
      indicateurIds: [indicateur.id, ...indicateurIdsOfRows],
      periode,
    });
  const onDelete = (periode: IndicateurPeriode): void => {
    const needsConfirmation =
      hasValeursOnPeriode({
        data,
        periode,
        periodicite,
        withOwnValeursOnParentRows: true,
      }) ||
      periodeKeysWithValeursPropres.has(IndicateurPeriodes.key(periode)) ||
      countCommentaires(commentaires.commentairesOf(periode)) > 0;
    if (needsConfirmation) {
      setPeriodeToDelete(periode);
      return;
    }
    void removePeriode(periode);
  };
  const [commentedPeriode, setCommentedPeriode] =
    useState<IndicateurPeriode | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useRevealIndicateurPeriode(scrollRef, declaration.periodeToReveal, periodes);

  return (
    <>
      <PeriodesTable
        title={indicateur.titre}
        label={appLabels.indicateurSousIndicateursValeurs}
        unite={indicateur.unite}
        periodes={periodes}
        rows={rows}
        readonly={isReadonly}
        deletablePeriodeKeys={deletablePeriodeKeys}
        addPeriode={declaration.addPeriode}
        scrollRef={scrollRef}
        commentaires={{
          isReadonly,
          countOf: (periode) =>
            countCommentaires(commentaires.commentairesOf(periode)),
          canComment: () => commentaires.isReady && !isReadonly,
          onComment: setCommentedPeriode,
        }}
        onDelete={onDelete}
      />
      {declaration.modal}
      {commentedPeriode && (
        <EditCommentaireModal
          periodeLabel={IndicateurPeriodes.format(commentedPeriode)}
          commentaires={commentaires.commentairesOf(commentedPeriode)}
          openState={{
            isOpen: true,
            setIsOpen: () => setCommentedPeriode(null),
          }}
          isReadonly={isReadonly}
          onChange={(periodeCommentaires) =>
            commentaires.save({
              periode: commentedPeriode,
              commentaires: periodeCommentaires,
            })
          }
        />
      )}
      {periodeToDelete && (
        <ConfirmDeleteSousIndicateursPeriode
          periode={periodeToDelete}
          onDismissConfirm={(isConfirmed) => {
            if (isConfirmed) {
              void removePeriode(periodeToDelete);
            }
            setPeriodeToDelete(null);
          }}
        />
      )}
    </>
  );
};

export const IndicateurPredefiniAvecEnfantsTable = ({
  isReadonly,
}: {
  isReadonly: boolean;
}): JSX.Element => {
  const { indicateur } = useIndicateurData();
  const { useSousIndicateursTable } = useIndicateurSousIndicateursTable();
  const state = useSousIndicateursTable(indicateur.id, NO_TOTALS);

  if (state.status === 'loading') {
    return <LoadingState />;
  }
  if (state.status === 'error') {
    return (
      <StatusMessage role="alert">
        {appLabels.indicateurSousIndicateursErreur}
      </StatusMessage>
    );
  }

  return (
    <ReadyTable
      isReadonly={isReadonly}
      collectiviteId={state.collectiviteId}
      data={state.data}
    />
  );
};
