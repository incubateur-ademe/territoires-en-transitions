import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { TAxeRow } from '@/app/types/alias';
import { ArrowRightIcon } from '@/app/ui/export-pdf/assets/icons';
import { Paragraph, Stack } from '@/app/ui/export-pdf/components';
import { preset } from '@/ui';

const { colors } = preset.theme.extend;

type CheminsProps = {
  chemins: TAxeRow[][];
};

export const Chemins = ({ chemins }: CheminsProps) => {
  return (
    <Stack gap={1}>
      {chemins.length > 0 ? (
        chemins.map((emplacement, index) => (
          <Stack key={index} gap={0.5} direction="row" className="flex-wrap">
            {emplacement.map((elt, i) => (
              <Stack
                key={i}
                gap="px"
                direction="row"
                className="flex-wrap items-end"
              >
                <Paragraph className="text-grey-7 text-[0.5rem]">
                  {generateTitle(elt.nom)}
                </Paragraph>
                {i !== emplacement.length - 1 && (
                  <ArrowRightIcon fill={colors.grey[6]} />
                )}
              </Stack>
            ))}
          </Stack>
        ))
      ) : (
        <Paragraph className="text-grey-7 text-[0.5rem]">
          Fiche non classée
        </Paragraph>
      )}
    </Stack>
  );
};
