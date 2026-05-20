import { appLabels } from '@/app/labels/catalog';
import Markdown from '@/app/ui/Markdown';
import { Valeur } from '@tet/api/indicateurs/domain/valeur.schema';
import { Tooltip } from '@tet/ui';
import { JSX } from 'react';

type DataSourceTooltipProps = {
  metadonnee: NonNullable<Valeur['source']>;
  calculAuto: boolean;
  nomSource: string;
  children: JSX.Element;
};

/**
 * Affiche une infobulle donnant les informations disponibles pour une source de
 * données externe.
 */
export const DataSourceTooltip = ({
  metadonnee,
  nomSource,
  calculAuto,
  children,
}: DataSourceTooltipProps) => {
  return (
    <Tooltip
      closingDelay={500}
      label={
        <DataSourceTooltipContent
          className="font-normal"
          metadonnee={metadonnee}
          nomSource={nomSource}
          calculAuto={calculAuto}
        />
      }
    >
      {children}
    </Tooltip>
  );
};

export const DataSourceTooltipContent = ({
  metadonnee,
  nomSource,
  className,
  calculAuto,
}: {
  metadonnee: DataSourceTooltipProps['metadonnee'];
  nomSource: string;
  className?: string;
  calculAuto: boolean;
}) => {
  const label = metadonnee.producteur || nomSource;

  return (
    <div className={className}>
      {!!label && (
        <p>
          <b>{label}</b>
        </p>
      )}
      {!!metadonnee.nomDonnees && metadonnee.nomDonnees !== nomSource && (
        <p>
          <b>{metadonnee.nomDonnees}</b>
        </p>
      )}
      {!!metadonnee.diffuseur && (
        <p>
          {appLabels.diffuseurLabel} <b>{metadonnee.diffuseur}</b>
        </p>
      )}
      {!!metadonnee.producteur && (
        <p>
          {appLabels.producteurLabel} <b>{metadonnee.producteur}</b>
        </p>
      )}
      {!!metadonnee.dateVersion && (
        <p>
          {appLabels.versionLabel}{' '}
          <b>{new Date(metadonnee.dateVersion).getFullYear()}</b>
        </p>
      )}
      {!!metadonnee.methodologie && (
        <p>
          {appLabels.methodologiePerimetreLabel}{' '}
          {calculAuto ? (
            appLabels.indicateurCalculeAutomatiquementMessage
          ) : (
            <Markdown
              content={metadonnee.methodologie}
              as="b"
              options={{ disallowedElements: ['p'], unwrapDisallowed: true }}
              openLinksInNewTab
            />
          )}
        </p>
      )}
      {!calculAuto && !!metadonnee.limites && (
        <p>
          {appLabels.pointsAttentionLimitesLabel} <b>{metadonnee.limites}</b>
        </p>
      )}
    </div>
  );
};
