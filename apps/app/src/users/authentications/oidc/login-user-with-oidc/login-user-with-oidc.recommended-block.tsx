'use client';

import { appLabels } from '@/app/labels/catalog';
import { Badge, ProConnectButton } from '@tet/ui';

type Contexte = 'connexion' | 'inscription';

const oidcLoginUrl = (backendUrl: string, contexte: Contexte) =>
  `${backendUrl}/api/v1/moncompteademe/login${
    contexte === 'inscription' ? '?intent=creation' : ''
  }`;

export const Separateur = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3.5 my-5">
    <span className="flex-1 h-px bg-grey-3" />
    <span className="text-sm text-grey-7">{label}</span>
    <span className="flex-1 h-px bg-grey-3" />
  </div>
);

export const OidcRecommendedBlock = ({
  backendUrl,
  contexte,
}: {
  backendUrl: string;
  contexte: Contexte;
}) => (
  <div className="flex flex-col gap-2 mt-6 mb-1">
    <div className="flex justify-center">
      <div className="relative">
        <ProConnectButton
          id={`${contexte}-oidc-recommande`}
          url={oidcLoginUrl(backendUrl, contexte)}
        />
        {contexte === 'inscription' && (
          <Badge
            title={appLabels.oidcRecommandeBadge}
            variant="success"
            size="sm"
            dataTest="oidc.recommande"
            className="pointer-events-none absolute -top-4 -right-5"
          />
        )}
      </div>
    </div>
    <p className="text-center text-sm text-grey-7 m-0">
      {contexte === 'inscription'
        ? appLabels.oidcSousTitreInscription
        : appLabels.oidcSousTitreConnexion}
    </p>
  </div>
);
