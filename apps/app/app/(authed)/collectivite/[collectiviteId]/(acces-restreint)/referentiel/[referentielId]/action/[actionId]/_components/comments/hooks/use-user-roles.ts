import { useUser } from '@/api/users/user-context/user-provider';

export const useUserRoles = () => {
  const user = useUser();

  const isAdeme = user?.email?.includes('@ademe.fr') ?? false;
  const isSupport = user?.isSupport;

  return {
    isAdeme,
    isSupport,
    // En attendant le refacto des roles et des permissions, on utilise le mail de l'utilisateur pour déterminer si l'utilisateur est un ADEME.
    canCreateDiscussion: !isSupport && !isAdeme,
  };
};
