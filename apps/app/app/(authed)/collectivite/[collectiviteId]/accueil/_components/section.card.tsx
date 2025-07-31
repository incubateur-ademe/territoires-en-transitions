import { Button, ButtonProps, Icon, Tooltip } from '@/ui';

type Props = {
  picto: React.ReactNode;
  title: string;
  description: string;
  additionalInfos?: string;
  buttons: ButtonProps[];
};

const SectionCard = ({
  picto,
  title,
  description,
  buttons,
  additionalInfos,
}: Props) => {
  return (
    <div className="flex flex-col p-6 bg-white border border-primary-2 rounded-xl">
      <div className="w-16 h-16 mb-2">{picto}</div>
      <div className="flex">
        <p className="mb-2 text-xl font-bold text-primary-9">{title}</p>
        {additionalInfos && (
          <Tooltip label={additionalInfos}>
            <Icon
              icon="information-line"
              size="sm"
              className="ml-1 text-primary"
            />
          </Tooltip>
        )}
      </div>
      <p className="text-primary-9">{description}</p>
      <div className="flex items-center flex-wrap gap-4 mt-auto">
        {buttons.map((button, index) => (
          <Button key={index} {...button} size="sm" />
        ))}
      </div>
    </div>
  );
};

export default SectionCard;
