import { appLabels } from '@/app/labels/catalog';
import { Badge, InlineLink, Tooltip } from '@tet/ui';

/** Badge permettant de savoir si l'indicateur détient des données en open data */
const BadgeOpenData = () => {
  return (
    <Tooltip
      className="max-w-xs"
      closingDelay={500}
      label={
        <div>
          {appLabels.badgeOpenDataExplanation}
          <InlineLink
            href="https://aide.territoiresentransitions.fr/fr/article/les-indicateurs-disponibles-en-open-data-1poyoso/"
            openInNewTab
          >
            {appLabels.enSavoirPlus}
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
