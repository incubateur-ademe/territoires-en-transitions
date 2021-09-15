import {Link} from 'react-router-dom';

export const DetailedEpciCardPropsLink = (props: {
  label: string;
  linkTo: string;
}) => (
  <Link to={props.linkTo}>
    <div className="flex flex-wrap text-xs text-bf500">
      {props.label}
      <div className="fr-fi-arrow-right-line fr-btn--icon-left pl-4"> </div>
    </div>
  </Link>
);
