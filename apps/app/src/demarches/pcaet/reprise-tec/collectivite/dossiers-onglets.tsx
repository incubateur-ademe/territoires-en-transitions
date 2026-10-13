'use client';

import { makeCollectiviteDemarchePcaetDocumentsUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Badge, ButtonMenu, Icon, Tooltip, useCopyToClipboard } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { KeyboardEvent, useRef, useState } from 'react';
import type { RecetteCollectiviteDetail } from '../data/use-get-collectivite';
import { IdCopiable } from './id-copiable';

type Dossier = RecetteCollectiviteDetail['dossiers'][number];

const VARIANTE_STATUT: Record<string, 'success' | 'info' | 'warning'> = {
  publie: 'success',
  instruit: 'info',
  en_elaboration: 'warning',
};

const libelleStatut = (d: Dossier) =>
  d.statut
    ? appLabels.repriseTecStatutTet(d.statut)
    : appLabels.repriseTecNonRepris;

const BadgeStatut = ({ d }: { d: Dossier }) =>
  d.demarcheId !== null ? (
    <Badge
      size="xs"
      variant={(d.statut && VARIANTE_STATUT[d.statut]) || 'success'}
      title={libelleStatut(d)}
    />
  ) : (
    <Badge size="xs" variant="grey" title={appLabels.repriseTecNonRepris} />
  );

const textesACopier = (nom: string, collectiviteId: number, d: Dossier) => {
  const idCollectivite =
    appLabels.repriseTecTexteCollectiviteIdTet(collectiviteId);
  const nonRepris = d.demarcheId === null;
  const lien = nonRepris
    ? null
    : `${window.location.origin}${makeCollectiviteDemarchePcaetDocumentsUrl({
        collectiviteId,
        demarcheId: d.demarcheId as number,
      })}`;
  const idTec = appLabels.repriseTecTexteDemarcheIdTec(
    d.tecDossierId,
    nonRepris
  );
  const idTet = nonRepris
    ? null
    : appLabels.repriseTecTexteDemarcheIdTet(d.demarcheId as number);
  const etat = appLabels.repriseTecTexteEtat(
    appLabels.repriseTecEtatTec(d.etat),
    libelleStatut(d)
  );
  return [
    {
      cle: 'identifiants',
      icone: 'hashtag',
      libelle: appLabels.repriseTecCopierIdentifiants,
      texte: [idCollectivite, idTet, idTec].filter(Boolean).join(' / '),
    },
    ...(lien
      ? [
          {
            cle: 'lien',
            icone: 'link',
            libelle: appLabels.repriseTecCopierLien,
            texte: lien,
          },
        ]
      : []),
    {
      cle: 'ticket',
      icone: 'file-text-line',
      libelle: appLabels.repriseTecCopierTicket(lien !== null),
      texte: [nom, idCollectivite, idTet, idTec, etat, lien]
        .filter(Boolean)
        .join('\n'),
    },
  ];
};

const MenuCopie = ({
  nom,
  collectiviteId,
  d,
}: {
  nom: string;
  collectiviteId: number;
  d: Dossier;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { copiedText, copy, reset } = useCopyToClipboard();
  const entrees = isOpen ? textesACopier(nom, collectiviteId, d) : [];
  return (
    <ButtonMenu
      size="xs"
      variant="outlined"
      icon="file-copy-line"
      withArrow
      aria-haspopup="menu"
      aria-expanded={isOpen}
      dataTest="admin.reprise-tec.copier-infos"
      menu={{
        openState: { isOpen, setIsOpen },
        placement: 'bottom-start',
        className: 'w-[400px] max-w-[calc(100vw-2rem)] p-1.5',
        startContent: (
          <div
            role="menu"
            aria-label={appLabels.repriseTecCopierInfosDossier}
            className="flex flex-col"
          >
            {entrees.map((e) => {
              const estCopie = copiedText === e.texte;
              return (
                <button
                  key={e.cle}
                  type="button"
                  role="menuitem"
                  onClick={() => copy(e.texte)}
                  onMouseLeave={reset}
                  className={cn(
                    'flex flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left hover:bg-primary-1',
                    estCopie && 'bg-success-2'
                  )}
                >
                  <span
                    aria-live="polite"
                    className={cn(
                      'flex items-center gap-1.5 text-sm font-medium',
                      estCopie ? 'text-success-1' : 'text-primary-9'
                    )}
                  >
                    <Icon icon={estCopie ? 'check-line' : e.icone} size="sm" />
                    {estCopie ? appLabels.repriseTecCopie : e.libelle}
                  </span>
                  <span className="max-w-full select-all whitespace-pre-line break-words pl-5 font-mono text-xs text-grey-8">
                    {e.texte}
                  </span>
                </button>
              );
            })}
          </div>
        ),
      }}
    >
      {appLabels.repriseTecCopierInfosDossier}
    </ButtonMenu>
  );
};

export const DossiersOnglets = ({
  nom,
  collectiviteId,
  dossiers,
  actif,
  onChoisir,
}: {
  nom: string;
  collectiviteId: number;
  dossiers: Dossier[];
  actif: Dossier;
  onChoisir: (tecDossierId: number) => void;
}) => {
  const onglets = useRef<(HTMLButtonElement | null)[]>([]);
  const indexActif = dossiers.findIndex(
    (d) => d.tecDossierId === actif.tecDossierId
  );

  const auClavier = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const cible = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: dossiers.length - 1,
    }[e.key];
    if (cible === undefined) return;
    e.preventDefault();
    const suivant = (cible + dossiers.length) % dossiers.length;
    onglets.current[suivant]?.focus();
    onChoisir(dossiers[suivant].tecDossierId);
  };

  return (
    <div className="flex flex-col">
      <div
        role="tablist"
        aria-label={appLabels.repriseTecDossiersTec}
        className="flex flex-wrap gap-1 border-b border-grey-4"
      >
        {dossiers.map((d, i) => {
          const estActif = i === indexActif;
          return (
            <button
              key={d.tecDossierId}
              ref={(el) => {
                onglets.current[i] = el;
              }}
              id={`onglet-dossier-${d.tecDossierId}`}
              data-test={`admin.reprise-tec.onglet-${d.tecDossierId}`}
              type="button"
              role="tab"
              aria-selected={estActif}
              aria-controls={estActif ? 'bandeau-dossier' : undefined}
              tabIndex={estActif ? 0 : -1}
              title={d.nom ?? undefined}
              onClick={() => onChoisir(d.tecDossierId)}
              onKeyDown={(e) => auClavier(e, i)}
              className={cn(
                'flex items-center rounded-t-lg border px-3.5 py-2.5 text-left',
                estActif
                  ? '-mb-px border-grey-4 border-b-primary-1 bg-primary-1 shadow-[inset_0_2px_0_0] shadow-primary-7'
                  : 'border-transparent bg-grey-2 hover:bg-primary-1'
              )}
            >
              <span className="flex items-center gap-2 whitespace-nowrap text-sm">
                <span className="text-grey-8">
                  {appLabels.repriseTecIdOnglet}
                </span>
                {d.demarcheId !== null && (
                  <>
                    <span className="font-bold text-primary-9">
                      {appLabels.repriseTecIdTetOnglet(d.demarcheId)}
                    </span>
                    <span aria-hidden className="text-grey-5">
                      {'|'}
                    </span>
                  </>
                )}
                <span
                  className={cn(
                    'font-bold',
                    d.demarcheId !== null ? 'text-grey-8' : 'text-grey-9'
                  )}
                >
                  {appLabels.repriseTecIdTecOnglet(d.tecDossierId)}
                </span>
                <BadgeStatut d={d} />
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="bandeau-dossier"
        role="tabpanel"
        aria-labelledby={`onglet-dossier-${actif.tecDossierId}`}
        className="flex flex-wrap items-center gap-2.5 rounded-b-lg border border-t-0 border-grey-4 bg-primary-1 px-3 py-2.5"
      >
        {actif.demarcheId !== null && (
          <IdCopiable
            label={appLabels.repriseTecDemarcheIdTet}
            value={String(actif.demarcheId)}
            tooltip={appLabels.repriseTecCopierIdDemarche}
          />
        )}
        <IdCopiable
          label={appLabels.repriseTecDemarcheIdTec}
          value={String(actif.tecDossierId)}
          variant="secondaire"
          tooltip={appLabels.repriseTecCopierIdTec}
        />
        {actif.demarcheId === null && (
          <span className="flex items-center gap-1 text-xs text-grey-8">
            <Icon icon="information-line" size="xs" />
            {appLabels.repriseTecPasDePageDansTet}
          </span>
        )}
        <MenuCopie
          key={actif.tecDossierId}
          nom={nom}
          collectiviteId={collectiviteId}
          d={actif}
        />
        <div className="flex basis-full items-center gap-2 border-t border-grey-3 pt-2 text-xs text-grey-8">
          <Tooltip label={appLabels.repriseTecStatutTec}>
            <span
              tabIndex={0}
              className="rounded focus-visible:outline-2 focus-visible:outline-primary-7"
            >
              <Badge
                size="xs"
                variant="grey"
                title={appLabels.repriseTecEtatTec(actif.etat)}
              />
            </span>
          </Tooltip>
          <Icon icon="arrow-right-line" size="xs" className="text-grey-8" />
          <Tooltip label={appLabels.repriseTecStatutArriveeTet}>
            <span
              tabIndex={0}
              className="rounded focus-visible:outline-2 focus-visible:outline-primary-7"
            >
              <BadgeStatut d={actif} />
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
