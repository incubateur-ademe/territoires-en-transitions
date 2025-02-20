import { Valeur } from '@/api/indicateurs/domain';
import Markdown from '@/app/ui/Markdown';
import { Tooltip } from '@/ui';

type DataSourceTooltipProps = {
  metadonnee: NonNullable<Valeur['source']>;
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
  children,
}: DataSourceTooltipProps) => {
  return (
    <Tooltip
      activatedBy="click"
      label={
        <DataSourceTooltipContent
          className="font-normal"
          metadonnee={metadonnee}
          nomSource={nomSource}
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
}: {
  metadonnee: DataSourceTooltipProps['metadonnee'];
  nomSource: string;
  className?: string;
}) => (
  <div className={className}>
    {!!nomSource && (
      <p>
        <b>{nomSource}</b>
      </p>
    )}
    {!!metadonnee.nomDonnees && metadonnee.nomDonnees !== nomSource && (
      <p>
        <b>{metadonnee.nomDonnees}</b>
      </p>
    )}
    {!!metadonnee.diffuseur && (
      <p>
        Diffuseur : <b>{metadonnee.diffuseur}</b>
      </p>
    )}
    {!!metadonnee.producteur && (
      <p>
        Producteur : <b>{metadonnee.producteur}</b>
      </p>
    )}
    Version : <b>{new Date(metadonnee.dateVersion).getFullYear()}</b>
    {!!metadonnee.methodologie && (
      <p>
        Méthodologie / Périmètre :{' '}
        <b>
          <Markdown content={metadonnee.methodologie} />
        </b>
      </p>
    )}
    {!!metadonnee.limites && (
      <p>
        Points d’attention / Limites : <b>{metadonnee.limites}</b>
      </p>
    )}
  </div>
);
