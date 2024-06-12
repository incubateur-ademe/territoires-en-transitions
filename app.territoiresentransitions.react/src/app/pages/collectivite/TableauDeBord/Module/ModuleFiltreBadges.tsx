import {Badge} from '@tet/ui';
import classNames from 'classnames';

type Props = {
  selectedFilters: string[];
  className?: string;
};

const ModuleFiltreBadges = ({className, selectedFilters}: Props) => {
  return (
    <div className={classNames('flex gap-4', className)}>
      {selectedFilters.map(filter => (
        <Badge key={filter} title={filter} state="standard" size="sm" />
      ))}
    </div>
  );
};

export default ModuleFiltreBadges;
