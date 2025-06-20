import { Divider } from '@/ui';

const SubactionCardActions = () => {
  return (
    <div className="flex flex-col gap-2">
      <Divider color="light" className="-mb-6 mt-auto" />

      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        {/* <span
          className="text-xs text-primary-8 hover:text-primary-9 font-medium cursor-pointer"
          onClick={(evt) => {
            evt.stopPropagation();
          }}
        >
          Modifier les données de l’indicateur
        </span>

        <div className="w-[0.5px] h-4 bg-grey-5" /> */}

        <span
          className="text-xs text-primary-8 hover:text-primary-9 font-medium cursor-pointer"
          onClick={(evt) => {
            evt.stopPropagation();
          }}
        >
          Détailler l'avancement
        </span>
      </div>

      <Divider color="light" className="-mb-6" />
    </div>
  );
};

export default SubactionCardActions;
