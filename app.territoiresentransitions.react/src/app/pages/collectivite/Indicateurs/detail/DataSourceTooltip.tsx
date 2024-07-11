import {Tooltip} from '@tet/ui';
import {Indicateurs} from '@tet/api';

/**
 * Affiche une infobulle donnant les informations disponibles pour une source de
 * données externe.
 */
export const DataSourceTooltip = ({
  metadonnee,
  children,
}: {
  metadonnee: Indicateurs.domain.SourceMetadonnee;
  children: JSX.Element;
}) => {
  return (
    <Tooltip
      label={
        <div>
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
      }
    >
      {children}
    </Tooltip>
  );
};
