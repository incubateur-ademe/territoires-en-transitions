import { Valeur } from '@/api/indicateurs/domain';
import { Tooltip } from '@/ui';

/**
 * Affiche une infobulle donnant les informations disponibles pour une source de
 * données externe.
 */
export const DataSourceTooltip = ({
  metadonnee,
  children,
}: {
  metadonnee: NonNullable<Valeur['source']>;
  // metadonnee: ReturnType<typeof transformeValeurs>['metadonnee'];
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
