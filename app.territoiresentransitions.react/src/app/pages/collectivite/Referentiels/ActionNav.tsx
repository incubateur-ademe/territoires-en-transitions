import Link from 'next/link';

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
  <div className="min-h-[1.5rem] flex justify-between fr-text--sm !m-0 fr-mt-2w overflow-hidden">
    {prevActionLink ? (
      <Link
        href={prevActionLink}
        className="fr-fi-arrow-left-line fr-btn--icon-left active-transparent"
      >
        Action précédente
      </Link>
    ) : (
      <div />
    )}
    {!!nextActionLink && (
      <Link
        href={nextActionLink}
        className="justify-self-end fr-fi-arrow-right-line fr-btn--icon-right active-transparent"
      >
        Action suivante
      </Link>
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
      <Link
        href={prevActionLink}
        className="fr-btn fr-btn--secondary fr-fi-arrow-left-line fr-btn--icon-left"
      >
        Action précédente
      </Link>
    )}
    {!!nextActionLink && (
      <Link
        href={nextActionLink}
        className="fr-btn fr-btn fr-fi-arrow-right-line fr-btn--icon-right"
      >
        Action suivante
      </Link>
    )}
  </div>
);
