import {useAuth} from 'core-logic/api/auth/AuthProvider';

const MonCompte = () => {
  const {user} = useAuth();

  return (
    <div>
      <h1 className="!mb-8 md:!mb-14">Mon compte</h1>
      <div className="p-4 md:p-14 lg:px-24 bg-gray-100">
        <p className="text-sm">Information requises</p>
        <p>{user?.prenom}</p>
        <p>{user?.nom}</p>
        <p>{user?.email}</p>
      </div>
    </div>
  );
};

export default MonCompte;
