import BudgetContent from '@/app/app/pages/collectivite/PlansActions/ExportPdf/FicheActionPdf/BudgetContent';
import {
  BadgeFinanceur,
  Divider,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import { FicheActionBudget, FicheWithRelations } from '@/domain/plans';
import { htmlToText } from '@/domain/utils';
import classNames from 'classnames';

type MoyensProps = {
  fiche: FicheWithRelations;
  budgets: FicheActionBudget[] | undefined;
};

export const Moyens = ({ fiche, budgets = [] }: MoyensProps) => {
  const { financeurs, financements, ressources } = fiche;

  const emptyFinancements = !financements;
  const emptyFinanceurs = !financeurs || financeurs.length === 0;
  const emptyRessources = !ressources || ressources.trim().length === 0;

  const budgetInvestissement = budgets.filter(
    (elt) => elt.type === 'investissement'
  );
  const budgetFonctionnement = budgets.filter(
    (elt) => elt.type === 'fonctionnement'
  );

  if (
    budgets.length === 0 &&
    emptyFinancements &&
    emptyFinanceurs &&
    emptyRessources
  ) {
    return null;
  }

  return (
    <>
      <Divider className="mt-2" />
      <Stack>
        <Title variant="h5" className="text-primary-8 uppercase">
          Budget
        </Title>

        <BudgetContent type="investissement" budgets={budgetInvestissement} />

        <BudgetContent type="fonctionnement" budgets={budgetFonctionnement} />

        {emptyFinanceurs ? (
          <Paragraph className="text-grey-7">
            <Paragraph className="text-primary-9 font-bold uppercase">
              Financeurs :{' '}
            </Paragraph>
            Non renseignés
          </Paragraph>
        ) : (
          <Stack direction="row" gap={1.5} className="flex-wrap items-center">
            <Paragraph className="text-primary-9 font-bold uppercase">
              Financeurs :
            </Paragraph>
            {financeurs.map((f) => (
              <BadgeFinanceur
                key={f.financeurTag.id}
                nom={f.financeurTag.nom}
                montant={f.montantTtc}
              />
            ))}
          </Stack>
        )}

        <Paragraph
          className={classNames({
            'text-grey-7': emptyFinancements,
          })}
        >
          <Paragraph className="text-primary-9 font-bold uppercase">
            Financements :{' '}
          </Paragraph>
          {!emptyFinancements ? financements : 'Non renseignés '}
        </Paragraph>
        <Paragraph
          className={classNames({
            'text-grey-7': emptyRessources,
          })}
        >
          <Paragraph className="text-primary-9 font-bold uppercase">
            Moyens humains et techniques :{' '}
          </Paragraph>
          {ressources ? htmlToText(ressources) : 'Non renseignés '}
        </Paragraph>
      </Stack>
    </>
  );
};
