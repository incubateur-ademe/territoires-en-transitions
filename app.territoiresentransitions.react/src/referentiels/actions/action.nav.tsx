import { Button } from '@/ui';

/**
 * Affiche les boutons "Action précédente" et "Action suivante" en haut de page
 */
export const ActionTopNav = ({
  prevActionLink,
  nextActionLink,
}: {
  prevActionLink: string | undefined;
  nextActionLink: string | undefined;
}) => (
  <div className="min-h-[1.5rem] flex justify-between overflow-hidden">
    {!!prevActionLink && (
      <Button
        className="text-white border-b-white"
        variant="underlined"
        icon="arrow-left-line"
        size="sm"
        href={prevActionLink}
      >
        Action précédente
      </Button>
    )}
    {!!nextActionLink && (
      <Button
        className="ml-auto text-white border-b-white"
        variant="underlined"
        icon="arrow-right-line"
        iconPosition="right"
        size="sm"
        href={nextActionLink}
      >
        Action suivante
      </Button>
    )}
  </div>
);

/**
 * Affiche les boutons "Action précédente" et "Action suivante" en bas de page
 */
export const ActionBottomNav = ({
  prevActionLink,
  nextActionLink,
}: {
  prevActionLink: string | undefined;
  nextActionLink: string | undefined;
}) => (
  <div className="flex justify-end mt-8 gap-4">
    {!!prevActionLink && (
      <Button
        variant="outlined"
        icon="arrow-left-line"
        size="sm"
        href={prevActionLink}
      >
        Action précédente
      </Button>
    )}
    {!!nextActionLink && (
      <Button
        icon="arrow-right-line"
        iconPosition="right"
        size="sm"
        href={nextActionLink}
      >
        Action suivante
      </Button>
    )}
  </div>
);
