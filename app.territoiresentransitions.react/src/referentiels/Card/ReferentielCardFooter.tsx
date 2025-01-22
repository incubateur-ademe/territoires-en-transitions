import { Personne } from '@/api/collectivites';
import { Icon, Tooltip } from '@/ui';

type ReferentielCardFooterProps = {
  pilotes: Personne[] | null | undefined;
};

export const ReferentielCardFooter = ({
  pilotes,
}: ReferentielCardFooterProps) => {
  const hasPilotes = !!pilotes && pilotes.length > 0;

  if (!hasPilotes) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-normal text-primary-9">
      <span title="Pilotes">
        <Icon icon="user-line" size="sm" className="mr-1" />
        {pilotes[0].nom}
        {pilotes.length > 1 && (
          <Tooltip
            openingDelay={250}
            label={
              <ul className="max-w-xs list-disc list-inside">
                {pilotes.map((pilote, i) => (
                  <li key={i}>{pilote.nom}</li>
                ))}
              </ul>
            }
          >
            <span className="ml-1.5 font-medium text-primary-8">
              +{pilotes.length - 1}
            </span>
          </Tooltip>
        )}
      </span>
    </div>
  );
};

export default ReferentielCardFooter;
