import { Acteurs } from './acteurs';
import { Description } from './description';
import { Panel } from './layout';
import { Planning } from './planning';

export const DetailsView = () => {
  return (
    <div className="flex gap-4 sm:flex-row flex-col">
      <div className="flex gap-4 w-full md:w-2/3 flex-col">
        <Panel>
          <Description />
        </Panel>
      </div>
      <div className="flex flex-col gap-4 min-w-[472px]">
        <Panel title="Calendrier">
          <Planning />
        </Panel>
        <Panel title="Acteurs du projet">
          <Acteurs />
        </Panel>
      </div>
    </div>
  );
};
