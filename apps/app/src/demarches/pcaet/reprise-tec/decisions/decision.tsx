import { makeRepriseTecCollectiviteUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Badge } from '@tet/ui';
import Link from 'next/link';
import type { Decisions } from '../data/use-list-decisions';
import { RegleLink } from '../regles/regle.link';

export const Decision = ({ decision }: { decision: Decisions[number] }) => (
  <div
    className="flex flex-col gap-2 rounded-lg border border-grey-3 bg-white p-4"
    data-test={`admin.reprise-tec.decision-${decision.code}`}
  >
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold text-grey-7">{decision.code}</span>
      <span className="font-bold text-primary-9">
        {appLabels.repriseTecDecision(decision.code)}
      </span>
      {decision.sections.map((numero) => (
        <RegleLink key={numero} numero={numero} />
      ))}
      <Badge
        size="xs"
        className="ml-auto"
        variant={decision.etat === 'ouverte' ? 'warning' : 'grey'}
        title={appLabels.repriseTecDecisionQui(decision.code)}
      />
    </div>
    <p className="mb-0 text-sm text-grey-9">
      {appLabels.repriseTecDecisionRegle(decision.code)}
    </p>
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className="font-bold text-primary-10">
        {appLabels.repriseTecDecisionTouche(
          decision.nombreDossiers,
          decision.nombreLignes
        )}
      </span>
      {decision.exemples.length > 0 && (
        <span className="text-grey-8">{appLabels.repriseTecExemples}</span>
      )}
      {decision.exemples.map((e) =>
        e.collectiviteId === null ? null : (
          <Link
            key={e.tecDossierId}
            href={makeRepriseTecCollectiviteUrl({
              collectiviteId: e.collectiviteId,
              tecDossierId: e.tecDossierId,
            })}
            className="text-primary-9 underline-offset-2 hover:underline"
          >
            {e.collectiviteNom}
          </Link>
        )
      )}
    </div>
  </div>
);
