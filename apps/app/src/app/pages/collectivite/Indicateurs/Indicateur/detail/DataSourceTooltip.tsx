import { useTelechargementMethodologieSnbc3 } from '@/app/app/pages/collectivite/Trajectoire/trajectoire-snbc3/data/use-telechargement-methodologie-snbc3';
import { appLabels } from '@/app/labels/catalog';
import Markdown from '@/app/ui/Markdown';
import { IndicateurSourceMetadonnee } from '@tet/domain/indicateurs';
import { Button, Tooltip } from '@tet/ui';
import { JSX, ReactNode } from 'react';

type DataSourceTooltipProps = {
  metadonnee: IndicateurSourceMetadonnee;
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
          methodologieSnbc3={<TelechargerMethodologieSnbc3Button />}
        />
      }
    >
      {children}
    </Tooltip>
  );
};

/** Télécharge le PDF de méthodologie de la release SNBC 3 importée. */
const TelechargerMethodologieSnbc3Button = () => {
  const { mutate: downloadMethodologie, isPending: isDownloading } =
    useTelechargementMethodologieSnbc3();
  return (
    <Button
      size="xs"
      variant="underlined"
      onClick={() => downloadMethodologie()}
      disabled={isDownloading}
    >
      {appLabels.trajectoireSnbc3ConsulterMethodologie}
    </Button>
  );
};

/**
 * Contenu de l'infobulle. `methodologieSnbc3` remplace le texte statique
 * affiché pour la SNBC 3 : le graphe rend ce contenu en HTML statique
 * (`renderToString`), où un bouton ne fonctionnerait pas.
 */
export const DataSourceTooltipContent = ({
  metadonnee,
  nomSource,
  className,
  calculAuto,
  methodologieSnbc3,
}: {
  metadonnee: DataSourceTooltipProps['metadonnee'];
  nomSource: string;
  className?: string;
  calculAuto: boolean;
  methodologieSnbc3?: ReactNode;
}) => {
  const label = metadonnee.producteur || nomSource;
  // La métadonnée SNBC 3 n'a pas de méthodologie en base : le PDF est celui de
  // la release importée, servi par le backend.
  const isSnbc3SansMethodologie =
    metadonnee.sourceId === 'snbc3' && !metadonnee.methodologie;

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
      {(!!metadonnee.methodologie || isSnbc3SansMethodologie) && (
        <p>
          {appLabels.methodologiePerimetreLabel}{' '}
          {calculAuto ? (
            appLabels.indicateurCalculeAutomatiquementMessage
          ) : isSnbc3SansMethodologie ? (
            methodologieSnbc3 ?? appLabels.indicateurMethodologieSnbc3Texte
          ) : (
            <Markdown
              content={metadonnee.methodologie ?? ''}
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
