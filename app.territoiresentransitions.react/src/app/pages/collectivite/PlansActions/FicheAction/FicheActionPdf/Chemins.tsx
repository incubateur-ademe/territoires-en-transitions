import { TAxeRow } from 'types/alias';
import { Paragraph, Stack } from 'ui/exportPdf/components';
import { generateTitle } from '../data/utils';

type CheminsProps = {
  chemins: TAxeRow[][];
};

const Chemins = ({ chemins }: CheminsProps) => {
  return (
    <Stack gap={2}>
      {chemins.map((chemin, index) => (
        <Paragraph key={index} className="text-grey-6 text-[0.7rem] leading-5">
          {chemin.map((elt, index) => {
            let text = generateTitle(elt.nom);
            if (index !== chemin.length - 1) {
              text += ' > ';
            }
            return text;
          })}
        </Paragraph>
      ))}
    </Stack>
  );
};

export default Chemins;
