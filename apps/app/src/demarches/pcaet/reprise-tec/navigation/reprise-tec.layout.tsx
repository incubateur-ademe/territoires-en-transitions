'use client';

import { makeRepriseTecReglesUrl, repriseTecUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Button, Icon } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ReactNode } from 'react';
import { useListCollectivites } from '../data/use-list-collectivites';
import { ReglePanel } from '../regles/regle.panel';
import { ArbreTerritoire, type Position } from './arbre-territoire';
import { Recherche } from './recherche';
import { usePanneauTerritoire } from './use-panneau-territoire';

const usePosition = (): Position => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const id = pathname.slice(repriseTecUrl.length + 1);
  return {
    region: searchParams.get('region'),
    departement: searchParams.get('departement'),
    collectiviteId: /^\d+$/.test(id) ? Number(id) : null,
  };
};

export const RepriseTecLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const position = usePosition();
  const { data } = useListCollectivites();
  const [panneauOuvert, basculerPanneau] = usePanneauTerritoire();
  const collectivites = data ?? [];
  const courante = collectivites.find(
    (c) =>
      position.collectiviteId !== null &&
      c.collectiviteId === position.collectiviteId
  );
  const lieu =
    courante?.nom ??
    position.departement ??
    position.region ??
    appLabels.repriseTecFrance;
  const surLesRegles = pathname === makeRepriseTecReglesUrl();

  return (
    <>
      <div className="flex flex-col" data-test="admin.reprise-tec.layout">
        <nav className="mb-0 flex gap-6 border-b border-grey-3">
          {[
            {
              href: repriseTecUrl,
              label: appLabels.repriseTecRecette,
              actif: !surLesRegles,
            },
            {
              href: makeRepriseTecReglesUrl(),
              label: appLabels.repriseTecRegles,
              actif: surLesRegles,
            },
          ].map((onglet) => (
            <Link
              key={onglet.href}
              href={onglet.href}
              aria-current={onglet.actif ? 'page' : undefined}
              className={cn(
                '-mb-px border-b-2 px-2 py-3 text-sm',
                onglet.actif
                  ? 'border-primary-9 font-medium text-primary-9'
                  : 'border-transparent text-primary-9 hover:border-grey-4'
              )}
            >
              {onglet.label}
            </Link>
          ))}
        </nav>
        <div className="sticky top-0 z-sticky-header border-b border-grey-4 bg-white py-3">
          <Recherche collectivites={collectivites} />
        </div>
        <div className="flex min-h-[calc(100vh-8rem)]">
          <aside
            className={cn(
              'hidden shrink-0 border-r border-grey-3 bg-white lg:sticky lg:top-[4.25rem] lg:block lg:h-[calc(100vh-4.25rem)]',
              panneauOuvert ? 'w-[340px] overflow-y-auto' : 'w-14'
            )}
          >
            {panneauOuvert ? (
              <ArbreTerritoire
                collectivites={collectivites}
                position={position}
                action={
                  <Button
                    size="xs"
                    variant="outlined"
                    icon="sidebar-fold-line"
                    onClick={basculerPanneau}
                    aria-expanded
                    aria-label={appLabels.repriseTecMasquerPanneau}
                    title={appLabels.repriseTecMasquerPanneau}
                  />
                }
              />
            ) : (
              <div className="flex h-full flex-col items-center">
                <div className="flex min-h-14 w-full items-center justify-center border-b border-grey-3">
                  <Button
                    size="xs"
                    variant="outlined"
                    icon="sidebar-unfold-line"
                    onClick={basculerPanneau}
                    aria-expanded={false}
                    aria-label={appLabels.repriseTecAfficherPanneau}
                    title={appLabels.repriseTecAfficherPanneau}
                  />
                </div>
                <button
                  type="button"
                  onClick={basculerPanneau}
                  className="flex flex-1 flex-col items-center gap-4 pt-4 text-primary-9 hover:bg-primary-1"
                  aria-label={appLabels.repriseTecAfficherPanneau}
                >
                  <Icon icon="node-tree" size="sm" />
                  <span className="max-h-[60vh] rotate-180 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold uppercase tracking-wider [writing-mode:vertical-rl]">
                    {appLabels.repriseTecTerritoireCourant(lieu)}
                  </span>
                </button>
              </div>
            )}
          </aside>
          <div className="min-w-0 flex-1 py-6 lg:pl-8">{children}</div>
        </div>
      </div>
      <ReglePanel />
    </>
  );
};
