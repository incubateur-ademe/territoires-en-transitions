// nettoie le prefixe attendu (si il existe) pour éviter les segments vides
const cleanUrlPrefix = (urlPrefix?: string) => {
  if (!urlPrefix) return undefined;

  const prefix = urlPrefix
    .split('/')
    .filter((s) => s && s !== '?')
    .join('/');

  if (!prefix) return undefined;
  return `/${prefix}`;
};

// renvoi `true` si le chemin contient un des segments donnés
export const pathIncludes = (pathname?: string, urlPrefix?: string[]) => {
  return urlPrefix
    ?.map((prefix) => cleanUrlPrefix(prefix))
    .find((prefix) => prefix && pathname?.includes(prefix));
};

export const isActiveNavLink = ({
  href,
  pathname,
  urlPrefix,
}: {
  href: string;
  pathname?: string;
  urlPrefix?: string[];
}) => pathname === href || pathIncludes(pathname, urlPrefix);

export const isActiveNavDropdown = ({
  links,
  pathname,
}: {
  links: string[];
  pathname?: string;
}) => links.findIndex((href) => pathname?.includes(href)) !== -1;
