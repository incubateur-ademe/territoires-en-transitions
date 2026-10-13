'use client';

import {
  makeRepriseTecCollectiviteUrl,
  makeRepriseTecUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { TableTreeToggle, TableTreeTogglePlaceholder } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import Link from 'next/link';
import { ReactNode, useState } from 'react';
import type { RecetteCollectivite } from '../data/use-list-collectivites';
import {
  GROUPES_AUTRES,
  grouperPorteur,
  type GroupePorteur,
} from './grouper-porteur';

export type Position = {
  region: string | null;
  departement: string | null;
  collectiviteId: number | null;
};

const LIBELLE_GROUPE: Record<GroupePorteur, string> = {
  epci: appLabels.repriseTecIntercommunalites,
  petr: appLabels.repriseTecGroupePetr,
  syndicat: appLabels.repriseTecGroupeSyndicat,
  commune: appLabels.repriseTecGroupeCommune,
  autre: appLabels.repriseTecGroupeAutre,
};

const grouper = <T,>(liste: T[], cle: (t: T) => string) => {
  const groupes = new Map<string, T[]>();
  for (const t of liste) {
    groupes.set(cle(t), [...(groupes.get(cle(t)) ?? []), t]);
  }
  return [...groupes].sort(([a], [b]) => a.localeCompare(b, 'fr'));
};

const Ligne = ({
  niveau,
  actif,
  children,
}: {
  niveau: number;
  actif: boolean;
  children: ReactNode;
}) => (
  <div
    className={cn(
      'flex min-h-9 items-center gap-1.5 border-l-4 pr-3 text-sm',
      actif
        ? 'border-primary-7 bg-primary-1 font-bold'
        : 'border-transparent hover:bg-grey-2'
    )}
    style={{ paddingLeft: `${0.5 + niveau}rem` }}
  >
    {children}
  </div>
);

const lienClassName = 'min-w-0 flex-1 truncate text-left text-primary-9';

export const ArbreTerritoire = ({
  collectivites,
  position,
  action,
}: {
  collectivites: RecetteCollectivite[];
  position: Position;
  action: ReactNode;
}) => {
  const courante = collectivites.find(
    (c) =>
      position.collectiviteId !== null &&
      c.collectiviteId === position.collectiviteId
  );
  const regionActive = position.region ?? courante?.region ?? null;
  const departementActif =
    position.departement ?? courante?.departement ?? null;
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());
  const [fermes, setFermes] = useState<Set<string>>(new Set());
  const actives = new Set([`r:${regionActive}`, `d:${departementActif}`]);
  const estOuvert = (cle: string) =>
    ouverts.has(cle) || (actives.has(cle) && !fermes.has(cle));
  const basculer = (cle: string) => {
    const ouvrir = !estOuvert(cle);
    const avec = (s: Set<string>) => new Set([...s, cle]);
    const sans = (s: Set<string>) => new Set([...s].filter((k) => k !== cle));
    setOuverts(ouvrir ? avec : sans);
    setFermes(ouvrir ? sans : avec);
  };

  const sansRegion = appLabels.repriseTecSansRegion;
  const sansDepartement = appLabels.repriseTecSansDepartement;
  const regions = grouper(collectivites, (c) => c.region ?? sansRegion);
  const triParNom = (liste: RecetteCollectivite[]) =>
    liste.slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

  const noeudCollectivite = (c: RecetteCollectivite) => (
    <Ligne
      key={c.tecCollectiviteId}
      niveau={2}
      actif={courante?.tecCollectiviteId === c.tecCollectiviteId}
    >
      <TableTreeTogglePlaceholder />
      {c.collectiviteId === null ? (
        <span className="min-w-0 flex-1 truncate text-grey-8">{c.nom}</span>
      ) : (
        <Link
          href={makeRepriseTecCollectiviteUrl({
            collectiviteId: c.collectiviteId,
          })}
          className={lienClassName}
        >
          {c.nom}
        </Link>
      )}
    </Ligne>
  );

  return (
    <nav
      aria-label={appLabels.repriseTecTerritoire}
      className="text-grey-10"
      data-test="admin.reprise-tec.arbre"
    >
      <div className="flex min-h-14 items-center justify-between gap-2 border-b border-grey-3 px-3 py-2.5">
        <span className="text-xs font-bold uppercase tracking-wide text-grey-8">
          {appLabels.repriseTecTerritoire}
        </span>
        {action}
      </div>
      <Ligne
        niveau={0}
        actif={!courante && regionActive === null && departementActif === null}
      >
        <TableTreeTogglePlaceholder />
        <Link href={makeRepriseTecUrl()} className={lienClassName}>
          {appLabels.repriseTecFranceEntiere}
        </Link>
        <span className="text-xs text-grey-8">{collectivites.length}</span>
      </Ligne>
      {regions.map(([region, deLaRegion]) => {
        const cleRegion = `r:${region}`;
        return (
          <div key={cleRegion}>
            <Ligne
              niveau={0}
              actif={
                !courante && position.region === region && !position.departement
              }
            >
              <TableTreeToggle
                isExpanded={estOuvert(cleRegion)}
                onToggle={() => basculer(cleRegion)}
                label={appLabels.repriseTecDepartementsDe(region)}
              />
              <Link
                href={makeRepriseTecUrl({ region })}
                className={lienClassName}
              >
                {region}
              </Link>
              <span className="text-xs text-grey-8">{deLaRegion.length}</span>
            </Ligne>
            {estOuvert(cleRegion) &&
              grouper(deLaRegion, (c) => c.departement ?? sansDepartement).map(
                ([departement, duDepartement]) => {
                  const cleDepartement = `d:${departement}`;
                  const parGroupe = new Map(
                    grouper(duDepartement, grouperPorteur)
                  );
                  const epci = parGroupe.get('epci') ?? [];
                  const autres = GROUPES_AUTRES.filter((g) => parGroupe.has(g));
                  return (
                    <div key={cleDepartement}>
                      <Ligne
                        niveau={1}
                        actif={
                          !courante && position.departement === departement
                        }
                      >
                        <TableTreeToggle
                          isExpanded={estOuvert(cleDepartement)}
                          onToggle={() => basculer(cleDepartement)}
                          label={appLabels.repriseTecPorteursDe(departement)}
                        />
                        <Link
                          href={makeRepriseTecUrl({ region, departement })}
                          className={lienClassName}
                        >
                          {departement}
                        </Link>
                        <span className="text-xs text-grey-8">
                          {duDepartement.length}
                        </span>
                      </Ligne>
                      {estOuvert(cleDepartement) && (
                        <>
                          {epci.length > 0 && (
                            <div className="pl-10 pt-2 text-xs uppercase tracking-wide text-grey-6">
                              {appLabels.repriseTecIntercommunalites}
                            </div>
                          )}
                          {triParNom(epci).map(noeudCollectivite)}
                          {autres.length > 0 && (
                            <div className="pl-10 pt-2 text-xs uppercase tracking-wide text-grey-6">
                              {appLabels.repriseTecAutresPorteurs}
                            </div>
                          )}
                          {autres.map((g) => (
                            <div key={g}>
                              <div className="pl-12 pt-1 text-xs text-grey-8">
                                {LIBELLE_GROUPE[g]}
                              </div>
                              {triParNom(parGroupe.get(g) ?? []).map(
                                noeudCollectivite
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  );
                }
              )}
          </div>
        );
      })}
    </nav>
  );
};
