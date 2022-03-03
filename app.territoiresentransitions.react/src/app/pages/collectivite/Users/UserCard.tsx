type TUserCardProps = {
  user: {
    user_id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  onRemove?: (id: string) => void;
};

/**
 * Affiche les nom et email d'un utilisateur ainsi qu'un bouton "Retirer"
 */
const UserCard = (props: TUserCardProps) => {
  const {user, onRemove} = props;
  const {email, nom, prenom} = user;

  return (
    <div className="flex max-w-2xl mb-5">
      <div className="flex flex-col w-3/4">
        <b>
          {prenom} {nom}
        </b>
        <span>{email}</span>
      </div>
      {onRemove ? (
        <button
          className="fr-btn fr-btn--secondary ml-4 h-6 self-center"
          onClick={() => onRemove(user.user_id)}
        >
          Retirer
        </button>
      ) : (
        ''
      )}
    </div>
  );
};

export default UserCard;
