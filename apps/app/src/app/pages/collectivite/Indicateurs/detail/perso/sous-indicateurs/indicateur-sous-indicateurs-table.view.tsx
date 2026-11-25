'use client';

import { PeriodesTable } from '@/app/indicateurs/valeurs/periodes-table/periodes-table';
import type { SaveSousIndicateurValeur } from '@/app/indicateurs/sous-indicateurs/data/use-save-sous-indicateur-valeur';
import type { RenameSousIndicateur } from '@/app/indicateurs/sous-indicateurs/data/use-rename-sous-indicateur';
import type { UpdateSousIndicateursCumul } from '@/app/indicateurs/sous-indicateurs/data/use-update-sous-indicateurs-cumul';
import type { DetachSousIndicateur } from '@/app/indicateurs/sous-indicateurs/data/use-detach-sous-indicateur';
import type { DeleteSousIndicateursPeriode } from '@/app/indicateurs/sous-indicateurs/data/use-delete-sous-indicateurs-periode';
import type { DeclareIndicateursPeriodes } from '@/app/indicateurs/valeurs/use-declare-indicateur-periodes';
import {
  findLatestResultatDate,
  type SousIndicateursTableData,
} from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table.rules';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Checkbox } from '@tet/ui';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { uniq } from 'es-toolkit';
import { useRef, useState, type JSX, type PropsWithChildren } from 'react';
import { IndicateurActionsRow } from '../../../table/indicateur-actions.row';
import { PrivateModeToggle } from '../../../table/private-mode-toggle';
import { EditCommentaireModal } from '../../../table/edit-commentaire-modal';
import { countCommentaires } from '../../../table/indicateur-periode-commentaires.rules';
import type { IndicateurPeriodeCommentaires } from '../../../table/use-indicateur-periode-commentaires';
import { useIndicateurPeriodeDeclaration } from '../../../table/use-indicateur-periode-declaration';
import { useRevealIndicateurPeriode } from '../../../table/use-reveal-indicateur-periode';
import { useIndicateurSousIndicateursTable } from '../context/indicateur-sous-indicateurs-table.context';
import { CreateSousIndicateurButton } from './create-sous-indicateur.button';
import { ConfirmDetachSousIndicateur } from './confirm-detach-sous-indicateur';
import { ConfirmDeleteSousIndicateursPeriode } from './confirm-delete-sous-indicateurs-periode';
import {
  hasValeursOnPeriode,
  toSousIndicateurTable,
  type DetachTarget,
} from './to-sous-indicateur-table-rows';
import type { IndicateurNouveauSousIndicateurValue } from '@/app/app/pages/collectivite/Indicateurs/detail/perso/context/indicateur-nouveau-sous-indicateur.context';
import { useSousIndicateurRowsExpansion } from './use-sous-indicateur-rows-expansion';

type PrivateMode = Readonly<{
  isConfidentiel: boolean;
  onChange: (isConfidentiel: boolean) => void;
}>;

type Props = {
  indicateurId: number;
  titre: string;
  unite: string;
  periodicite: IndicateurPeriodicite;
  isReadonly: boolean;
  canMutateIndicateur: boolean;
  isCumul: boolean;
  newSousIndicateur: IndicateurNouveauSousIndicateurValue;
  privateMode: PrivateMode;
};

type ReadyTableProps = Props & {
  collectiviteId: number;
  saveValeur: SaveSousIndicateurValeur;
  declarePeriodes: DeclareIndicateursPeriodes;
  deletePeriode: DeleteSousIndicateursPeriode;
  commentaires: IndicateurPeriodeCommentaires;
  detachSousIndicateur: DetachSousIndicateur;
  updateCumul: UpdateSousIndicateursCumul;
  renameSousIndicateur: RenameSousIndicateur;
  data: SousIndicateursTableData;
};

const StatusMessage = ({
  role,
  children,
}: PropsWithChildren<{ role?: 'alert' }>): JSX.Element => (
  <p role={role} className="text-center text-sm text-grey-7">
    {children}
  </p>
);

const LoadingState = (): JSX.Element => (
  <div role="status" className="my-8 flex justify-center">
    <SpinnerLoader className="mx-auto" />
    <span className="sr-only">
      {appLabels.indicateurSousIndicateursChargement}
    </span>
  </div>
);

const ReadyTable = ({
  indicateurId,
  titre,
  unite,
  periodicite,
  isReadonly,
  collectiviteId,
  saveValeur,
  declarePeriodes,
  deletePeriode,
  commentaires,
  detachSousIndicateur,
  updateCumul,
  renameSousIndicateur,
  canMutateIndicateur,
  isCumul,
  newSousIndicateur,
  privateMode,
  data,
}: ReadyTableProps): JSX.Element => {
  const { visibleRows, isExpanded, toggle } = useSousIndicateurRowsExpansion(
    data.rows
  );
  const [detachTarget, setDetachTarget] = useState<DetachTarget | null>(null);
  const { periodes, rows } = toSousIndicateurTable({
    data: { ...data, hasTotalRow: isCumul && data.hasTotalRow },
    visibleRows,
    periodicite,
    collectiviteId,
    isReadonly,
    saveValeur,
    requestDetachSousIndicateur: canMutateIndicateur
      ? setDetachTarget
      : undefined,
    renameSousIndicateur: canMutateIndicateur
      ? renameSousIndicateur
      : undefined,
    focusedNameIndicateurId: newSousIndicateur.id,
    onNameEditingEnd: newSousIndicateur.onNameEditingEnd,
    isExpanded,
    onToggle: toggle,
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
  const [periodeToDelete, setPeriodeToDelete] =
    useState<IndicateurPeriode | null>(null);
  const removePeriode = (periode: IndicateurPeriode): Promise<void> =>
    deletePeriode({
      indicateurIds: [indicateurId, ...leafIndicateurIds],
      periode,
    });
  const onDelete = (periode: IndicateurPeriode): void => {
    if (
      hasValeursOnPeriode({ data, periode, periodicite }) ||
      countCommentaires(commentaires.commentairesOf(periode)) > 0
    ) {
      setPeriodeToDelete(periode);
      return;
    }
    void removePeriode(periode);
  };
  const [commentedPeriode, setCommentedPeriode] =
    useState<IndicateurPeriode | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useRevealIndicateurPeriode(scrollRef, declaration.periodeToReveal, periodes);
  const privatePeriodeDate = privateMode.isConfidentiel
    ? findLatestResultatDate(data)
    : null;
  const privatePeriodeKey =
    privatePeriodeDate === null
      ? undefined
      : IndicateurPeriodes.key(
          IndicateurPeriodes.containing(periodicite, privatePeriodeDate)
        );

  return (
    <>
      <PeriodesTable
        title={titre}
        label={appLabels.indicateurSousIndicateursValeurs}
        unite={unite}
        periodes={periodes}
        rows={rows}
        readonly={isReadonly}
        deletablePeriodeKeys={new Set(periodes.map(IndicateurPeriodes.key))}
        privatePeriodeKey={privatePeriodeKey}
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
      {canMutateIndicateur && (
        <IndicateurActionsRow
          leading={
            <CreateSousIndicateurButton
              parentId={indicateurId}
              childCount={data.rows.filter((row) => row.depth === 0).length}
              onCreated={newSousIndicateur.onCreated}
            />
          }
        >
          {periodes.length > 0 && (
            <Checkbox
              variant="switch"
              label={appLabels.indicateurCumulSousIndicateurs}
              labelClassname="text-primary-9"
              checked={isCumul}
              onChange={() => updateCumul(!isCumul)}
            />
          )}
          {periodes.length > 0 && (
            <PrivateModeToggle
              isConfidentiel={privateMode.isConfidentiel}
              onChange={privateMode.onChange}
            />
          )}
        </IndicateurActionsRow>
      )}
      {declaration.modal}
      {detachTarget && (
        <ConfirmDetachSousIndicateur
          label={detachTarget.label}
          onDismissConfirm={(isConfirmed) => {
            if (isConfirmed) {
              detachSousIndicateur(detachTarget.indicateurId);
            }
            setDetachTarget(null);
          }}
        />
      )}
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

export const IndicateurSousIndicateursTable = ({
  indicateurId,
  titre,
  unite,
  periodicite,
  isReadonly,
  canMutateIndicateur,
  isCumul,
  newSousIndicateur,
  privateMode,
}: Props): JSX.Element => {
  const {
    useSousIndicateursTable,
    useSaveSousIndicateurValeur,
    useDeclareSousIndicateursPeriodes,
    useDeleteSousIndicateursPeriode,
    useDetachSousIndicateur,
    useUpdateSousIndicateursCumul,
    useRenameSousIndicateur,
    useIndicateurPeriodeCommentaires,
  } = useIndicateurSousIndicateursTable();
  const state = useSousIndicateursTable(indicateurId);
  const saveValeur = useSaveSousIndicateurValeur();
  const declarePeriodes = useDeclareSousIndicateursPeriodes();
  const deletePeriode = useDeleteSousIndicateursPeriode();
  const detachSousIndicateur = useDetachSousIndicateur();
  const updateCumul = useUpdateSousIndicateursCumul(indicateurId);
  const renameSousIndicateur = useRenameSousIndicateur();
  const commentaires = useIndicateurPeriodeCommentaires();

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
  if (state.data.rows.length === 0) {
    return <StatusMessage>{appLabels.aucuneDonneeDisponible}</StatusMessage>;
  }

  return (
    <ReadyTable
      indicateurId={indicateurId}
      titre={titre}
      unite={unite}
      periodicite={periodicite}
      isReadonly={isReadonly}
      collectiviteId={state.collectiviteId}
      saveValeur={saveValeur}
      declarePeriodes={declarePeriodes}
      deletePeriode={deletePeriode}
      commentaires={commentaires}
      detachSousIndicateur={detachSousIndicateur}
      updateCumul={updateCumul}
      renameSousIndicateur={renameSousIndicateur}
      canMutateIndicateur={canMutateIndicateur}
      isCumul={isCumul}
      newSousIndicateur={newSousIndicateur}
      privateMode={privateMode}
      data={state.data}
    />
  );
};
