import { Badge, InlineLink, Tooltip } from '@tet/ui';

/** Badge permettant de savoir si l'indicateur détient des données en open data */
const BadgeOpenData = () => {
  return (
    <Tooltip
      className="max-w-xs"
      closingDelay={500}
      label={
        <div>
          Nous mettons à votre disposition automatiquement des données issues de
          sources vérifiées (CEREMA, RARE, SINOE…).
          <InlineLink
            href="https://aide.territoiresentransitions.fr/fr/article/les-indicateurs-disponibles-en-open-data-1poyoso/"
            openInNewTab
          >
            en savoir plus
          </InlineLink>
        </div>
      }
    >
      <div>
        <Badge
          icon="database-2-line"
          iconPosition="left"
          title="Open Data"
          variant="standard"
          size="xs"
          type="outlined"
        />
      </div>
    </Tooltip>
  );
};

export default BadgeOpenData;
