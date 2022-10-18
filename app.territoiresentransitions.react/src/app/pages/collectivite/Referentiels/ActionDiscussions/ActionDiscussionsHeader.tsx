import {TVue} from './ActionDiscussions';
import ChangeVueDropdown from './ChangeVueDropdown';

type Props = {
  closeActionDiscussions: () => void;
  vue: TVue;
  changeVue: (vue: TVue) => void;
};

const ActionDiscussionsHeader = ({
  closeActionDiscussions,
  vue,
  changeVue,
}: Props) => {
  return (
    <div className="p-6 border-b border-gray-200">
      <button
        className="p-2 text-gray-400 fr-fi-arrow-right-s-line-double hover:bg-gray-50"
        onClick={closeActionDiscussions}
      />
      <div className="flex items-center mt-6">
        <div className="flex items-center py-1 px-3 text-sm text-white bg-bf500 rounded-full">
          <span className="w-3 h-3 mr-2 bg-yellow-400" />
          Commentaires
        </div>
        <ChangeVueDropdown vue={vue} changeVue={changeVue} />
      </div>
    </div>
  );
};

export default ActionDiscussionsHeader;
