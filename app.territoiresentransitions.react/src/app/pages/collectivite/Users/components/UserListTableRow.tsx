import {useMemo} from 'react';
import {Referentiel} from 'types/litterals';
import {Acces, Fonction, User} from './fakeData';

export type UserListTableRowProps = {
  currentUser: User;
  user: User;
};

const rowClassNames = 'h-20 border-b border-gray-300 bg-white';
const cellClassNames = 'relative px-4';

const UserListTableRow = ({currentUser, user}: UserListTableRowProps) => {
  const fonctionOptions = Object.values(Fonction);
  const interventionOptions: Referentiel[] = ['cae', 'eci'];
  const accesOptions = Object.values(Acces);

  const isCurrentUser = useMemo(() => {
    return currentUser.user_id === user.user_id;
  }, [currentUser.user_id, user.user_id]);

  return (
    <tr className={`${rowClassNames}`}>
      <td className={`${cellClassNames}`}>
        <span className="font-bold">
          {user.nom} {user.prenom}
        </span>
        <span className="block mt-1 text-xs text-gray-500">{user.email}</span>
      </td>
      <td className={`${cellClassNames}`}>
        <span>{user.tel}</span>
      </td>
      <td className={`${cellClassNames}`}>
        {/* <span>{user.fonction}</span> */}
        {isCurrentUser ? (
          <FonctionDropdown value={user.fonction} options={fonctionOptions} />
        ) : (
          <span>{user.fonction}</span>
        )}
      </td>
      <td className={`${cellClassNames} pr-0`}>
        {isCurrentUser ? (
          <ChampsInterventionDropdown
            values={user.champ_intervention}
            options={interventionOptions}
          />
        ) : (
          user.champ_intervention.map(champ => (
            <span key={champ} className="block">
              {champ === 'cae' ? 'Climat Air Énergie' : 'Économie circulaire'}
            </span>
          ))
        )}
      </td>
      <td className={`${cellClassNames}`}>
        {isCurrentUser ? (
          <div className="py-1 px-2 border border-gray-300">
            <textarea
              value={user.details_fonction}
              className="w-full resize-none"
            />
          </div>
        ) : (
          <span title={user.details_fonction} className="w-72 line-clamp-3">
            {user.details_fonction}
          </span>
        )}
      </td>
      <td className={`${cellClassNames} text-right`}>
        {isCurrentUser || currentUser.acces === Acces.admin ? (
          <AccesDropdown
            isCurrentUser={isCurrentUser}
            currentUser={currentUser}
            value={user.acces}
            options={accesOptions}
          />
        ) : (
          <span>{user.acces}</span>
        )}
      </td>
    </tr>
  );
};

export default UserListTableRow;

const FonctionDropdown = ({
  value,
  options,
}: {
  value: Fonction;
  options: Fonction[];
}) => {
  return (
    <div className="group relative">
      <button className="flex items-center w-full p-2 -ml-2 text-left">
        <span className="mr-auto">{value}</span>
        <span className="fr-fi-arrow-down-s-line mt-1 ml-1 scale-90 group-focus-within:rotate-180" />
      </button>
      <div className="bg-white invisible absolute -left-2 top-full min-w-full w-max transition-all opacity-0 shadow-md group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-1 z-50">
        {options.map((v: Fonction) => (
          <button className="flex items-center w-full p-2 text-left">
            <div className="w-6 mr-2">
              {value === v && (
                <span className="block fr-fi-check-line scale-75" />
              )}
            </div>
            <span>{v}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ChampsInterventionDropdown = ({
  values,
  options,
}: {
  values: Referentiel[];
  options: Referentiel[];
}) => {
  return (
    <div className="group relative">
      <button className="flex items-center w-full p-2 -ml-2 text-left">
        <div className="mr-auto">
          {values.map(v => (
            <span key={v} className="block">
              {v === 'cae' ? 'Climat Air Énergie' : 'Économie circulaire'}
            </span>
          ))}
        </div>
        <span className="fr-fi-arrow-down-s-line mt-1 ml-1 scale-90 group-focus-within:rotate-180" />
      </button>
      <div className="bg-white invisible absolute -left-2 top-full min-w-full w-max transition-all opacity-0 shadow-md group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-1 z-50">
        {options.map((v: Referentiel) => (
          <button className="flex items-center w-full p-2 pr-4 text-left">
            <div className="w-6 mr-2">
              {values.some(value => value === v) && (
                <span className="block fr-fi-check-line scale-75" />
              )}
            </div>
            <span>
              {v === 'cae' ? 'Climat Air Énergie' : 'Économie circulaire'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

type AccesDropdownProps = {
  isCurrentUser: boolean;
  currentUser: User;
  value: Acces;
  options: Acces[];
};

const AccesDropdown = ({
  isCurrentUser,
  currentUser,
  value,
  options,
}: AccesDropdownProps) => {
  return (
    <div className="group relative flex -mr-2">
      <button className="flex items-center ml-auto p-2 text-left">
        <span className="fr-fi-arrow-down-s-line mt-1 mr-1 scale-90 group-focus-within:rotate-180" />
        <span className="mr-auto">{value}</span>
      </button>
      <div className="bg-white invisible absolute right-0 top-full min-w-full w-max transition-all opacity-0 shadow-md group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-1 z-50">
        {currentUser.acces === Acces.admin ? (
          options.map((v: Acces) => (
            <button className="flex items-center w-full p-2 pr-4 text-left">
              <div className="w-6 mr-2">
                {value === v && (
                  <span className="block fr-fi-check-line scale-75" />
                )}
              </div>
              <div>
                <div>{v}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {v === Acces.admin && 'Peut entièrement configurer et éditer'}
                  {v === Acces.edition &&
                    'Peut éditer et inviter de nouveaux membres'}
                  {v === Acces.lecture && 'Peut uniquement consulter'}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="flex items-center w-full p-2 text-left">
            <div className="w-6 mr-2">
              <span className="block fr-fi-check-line scale-75" />
            </div>
            <div>
              <div>{currentUser.acces}</div>
              <div className="mt-1 text-xs text-gray-500">
                {currentUser.acces === Acces.edition &&
                  'Peut éditer et inviter de nouveaux membres'}
                {currentUser.acces === Acces.lecture &&
                  'Peut uniquement consulter'}
              </div>
            </div>
          </div>
        )}
        <button className="flex w-full px-2 py-4 text-left text-red-600">
          <div className="w-8" />
          {`${
            isCurrentUser ? 'Retirer mon accès à' : 'Retirer ce membre de'
          } la collectivité`}
        </button>
      </div>
    </div>
  );
};
