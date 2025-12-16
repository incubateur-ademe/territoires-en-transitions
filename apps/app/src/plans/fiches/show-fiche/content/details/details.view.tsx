import { Acteurs } from './acteurs';
import { Description } from './description';
import { Panel } from './layout';
import { Planning } from './planning';

const ActionImagePlaceholderForNow = () => {
  return (
    <div className="hidden sm:block bg-primary-6 h-[150px] w-full rounded-md" />
  );
};

export const DetailsView = () => {
  return (
    <div className="flex gap-4 sm:flex-row flex-col">
      <div className="flex gap-4 w-full md:w-2/3 flex-col">
        <Panel title="Description">
          <Description />
        </Panel>
        <Panel title="Calendrier">
          <Planning />
        </Panel>
      </div>
      <div className="flex flex-col gap-4 min-w-[472px]">
        <ActionImagePlaceholderForNow />
        <Panel title="Acteurs du projet">
          <Acteurs />
        </Panel>
      </div>
    </div>
  );
};
