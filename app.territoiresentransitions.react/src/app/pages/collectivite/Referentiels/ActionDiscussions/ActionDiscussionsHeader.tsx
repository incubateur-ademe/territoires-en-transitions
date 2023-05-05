import ChangeVueDropdown from './ChangeVueDropdown';
import {TActionDiscussionStatut} from './data/types';

type Props = {
  vue: TActionDiscussionStatut;
  changeVue: (vue: TActionDiscussionStatut) => void;
};

/** Header du panneau de discussion d'une action */
const ActionDiscussionsHeader = ({vue, changeVue}: Props) => {
  return (
    <div className="flex fr-px-2w fr-pb-2w">
      <div className="flex items-center py-1 px-3 text-sm text-white bg-bf500 rounded-full">
        <span className="w-3 h-3 mr-2 bg-yellow-400" />
        Commentaires
      </div>
      <ChangeVueDropdown vue={vue} changeVue={changeVue} />
    </div>
  );
};

export default ActionDiscussionsHeader;
