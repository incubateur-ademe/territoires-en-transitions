import {Link} from 'react-router-dom';

export type TFilArianeLink = {
  path?: string;
  displayedName: string;
};

type Props = {
  links: TFilArianeLink[];
};

const FilAriane = ({links}: Props) => {
  return (
    <div className="flex items-center pr-6 text-xs text-gray-500">
      {links.map((link, i) =>
        link.path ? (
          <div key={link.displayedName} className="flex items-center">
            <Link
              className="p-1 underline shrink-0 text-gray-500 !shadow-none hover:text-gray-600"
              to={link.path}
            >
              {link.displayedName}
            </Link>
            {i + 1 < links.length && (
              <div className="fr-fi-arrow-down-s-line scale-75 -rotate-90" />
            )}
          </div>
        ) : (
          <div key={link.displayedName} className="line-clamp-1">
            {link.displayedName}
          </div>
        )
      )}
    </div>
  );
};

export default FilAriane;
