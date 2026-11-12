'use client';

import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useSelectedLayoutSegments } from 'next/navigation';
import { ReactNode } from 'react';

/**
 * La démarche dont on ouvre les écrans du dossier, d'après les segments sous le
 * garde : `demarche-pcaet/<id>/…`. Ni la création ni la consultation publique.
 */
export const getDemarcheDuDossier = (segments: string[]): number | null => {
  const [racine, demarcheId] = segments;
  return racine === 'demarche-pcaet' && /^\d+$/.test(demarcheId ?? '')
    ? Number(demarcheId)
    : null;
};

const Inaccessible = () => (
  <div className="flex-grow flex">
    <div className="m-auto text-grey-7">
      {appLabels.collectiviteInaccessibleEnVisite}
    </div>
  </div>
);

/**
 * Le dossier d'un Supra en accès restreint s'ouvre quand même au membre d'un
 * EPCI que couvre ce dépôt : il n'a aucun rôle sur le Supra, donc il y est
 * visiteur. Le serveur tranche, démarche par démarche ; les autres pages du
 * Supra restent fermées.
 */
const DossierLuParCouverture = ({
  collectiviteId,
  demarcheId,
  children,
}: {
  collectiviteId: number;
  demarcheId: number;
  children: ReactNode;
}) => {
  const trpc = useTRPC();
  const { isPending, isSuccess } = useQuery(
    trpc.demarches.pcaet.get.queryOptions(
      { collectiviteId, demarcheId },
      { retry: false }
    )
  );

  if (isPending) {
    return (
      <div className="flex grow items-center justify-center">
        <SpinnerLoader />
      </div>
    );
  }
  return isSuccess ? children : <Inaccessible />;
};

export const AccesRestreintGuard = ({ children }: { children: ReactNode }) => {
  const collectivite = useCurrentCollectivite();
  const isVisitor = useIsVisitor();
  const demarcheId = getDemarcheDuDossier(useSelectedLayoutSegments());

  if (!collectivite.accesRestreint || !isVisitor) {
    return children;
  }
  if (demarcheId !== null) {
    return (
      <DossierLuParCouverture
        collectiviteId={collectivite.collectiviteId}
        demarcheId={demarcheId}
      >
        {children}
      </DossierLuParCouverture>
    );
  }
  return <Inaccessible />;
};
