import { usePathname } from 'next/navigation';

// TODO: Utiliser un react context here basé sur les useParams quand toutes les routes seront sous Next
export const useCollectiviteId = (): number | null => {
  const pathname = usePathname();
  // Match /collectivite/123 or /collectivite/123/
  const match = pathname.match(/^\/collectivite\/(\d+)/);
  const collectiviteId = match ? parseInt(match[1]) : null;

  return collectiviteId;
};
