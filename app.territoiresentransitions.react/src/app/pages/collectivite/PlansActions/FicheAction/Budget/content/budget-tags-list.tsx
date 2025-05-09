import { getFormattedFloat } from '@/app/utils/formatUtils';
import { Badge } from '@/ui';

type BudgetTagsListProps = {
  tags?: { name: string; amount: number | null | undefined }[];
  unit?: 'HT' | 'ETP';
};

const BudgetTagsList = ({ tags, unit = 'HT' }: BudgetTagsListProps) => {
  return (
    <>
      {(tags ?? []).map((tag, index) => (
        <div key={`${tag.name}-${index}`} className="flex">
          <Badge
            title={tag.name}
            state="standard"
            uppercase={false}
            className="!rounded-r-none"
          />
          <Badge
            title={
              !tag.amount && tag.amount !== 0 ? (
                'Non renseigné'
              ) : (
                <span>
                  {getFormattedFloat(tag.amount)}{' '}
                  {unit === 'HT' ? (
                    <>
                      € <sup className="-top-[0.4em]">HT</sup>
                    </>
                  ) : (
                    'ETP'
                  )}
                </span>
              )
            }
            state="standard"
            light
            uppercase={false}
            className="!rounded-l-none"
          />
        </div>
      ))}
    </>
  );
};

export default BudgetTagsList;
