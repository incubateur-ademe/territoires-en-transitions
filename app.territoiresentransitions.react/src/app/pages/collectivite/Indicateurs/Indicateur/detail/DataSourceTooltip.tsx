import { Valeur } from '@/api/indicateurs/domain';
import { Tooltip } from '@/ui';

type DataSourceTooltipProps = {
  metadonnee: NonNullable<Valeur['source']>;
  children: JSX.Element;
};

/**
 * Affiche une infobulle donnant les informations disponibles pour une source de
 * données externe.
 */
export const DataSourceTooltip = ({
  metadonnee,
  children,
}: DataSourceTooltipProps) => {
  return (
    <Tooltip
      label={
        <DataSourceTooltipContent
          className="font-normal"
          metadonnee={metadonnee}
        />
      }
    >
      {children}
    </Tooltip>
  );
};

export const DataSourceTooltipContent = ({
  metadonnee,
  className,
}: {
  metadonnee: DataSourceTooltipProps['metadonnee'];
  className?: string;
}) => (
  <div className={className}>
    {!!metadonnee.nomDonnees && (
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
        Méthodologie / Périmètre : <b>{metadonnee.methodologie}</b>
      </p>
    )}
    {!!metadonnee.limites && (
      <p>
        Points d’attention / Limites : <b>{metadonnee.limites}</b>
      </p>
    )}
  </div>
);
