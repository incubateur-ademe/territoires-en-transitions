import {NavLink} from 'react-router-dom';

type TActionCard = {
  link: string;
  statutBadge?: JSX.Element | null;
  details?: string | null;
  title: string;
};

const ActionCard = ({link, statutBadge, details, title}: TActionCard) => {
  return (
    <div data-test="ActionCarte" className="border border-gray-200">
      <NavLink to={link}>
        <div className="flex flex-col h-full p-6">
          {statutBadge && <div className="mb-4">{statutBadge}</div>}
          <div className="-mt-2 mb-3 text-xs text-gray-500">{details}</div>
          <div className="mb-auto font-bold line-clamp-3">{title}</div>
          <span className="fr-fi-arrow-right-line ml-auto mt-4 text-bf500 scale-75" />
        </div>
      </NavLink>
    </div>
  );
};

export default ActionCard;
