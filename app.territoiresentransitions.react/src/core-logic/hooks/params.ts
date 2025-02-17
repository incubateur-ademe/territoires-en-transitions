import { usePathname } from 'next/navigation';

/**
 * @deprecated: use hook from collectivite-context.tsx instead
 */
export const useCollectiviteId = (): number | null => {
  const pathname = usePathname();
  // Match /collectivite/123 or /collectivite/123/
  const match = pathname.match(/^\/collectivite\/(\d+)/);
  const collectiviteId = match ? parseInt(match[1]) : null;

  return collectiviteId;
};
