import { useUser } from '@/api/users/user-context/user-provider';

export const useUserRoles = () => {
  const user = useUser();

  return {
    isAdeme: user?.email.includes('@ademe.fr'),
    isSupport: user?.isSupport,
    // En attendant le refacto des roles et des permissions, on utilise le mail de l'utilisateur pour déterminer si l'utilisateur est un ADEME.
    canCreateDiscussion: !user?.isSupport && !user?.email.includes('@ademe.fr'),
  };
};
