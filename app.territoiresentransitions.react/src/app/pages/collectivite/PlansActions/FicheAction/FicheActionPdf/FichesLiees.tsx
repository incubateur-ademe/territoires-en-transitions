import { format, isBefore, startOfToday } from 'date-fns';
import classNames from 'classnames';
import { FicheResume } from '@tet/api/plan-actions';
import {
  Box,
  Card,
  Divider,
  Paragraph,
  Stack,
  Title,
} from 'ui/exportPdf/components';
import { generateTitle } from '../data/utils';
import { getTextFormattedDate } from '../utils';

type FicheLieeCardProps = {
  ficheLiee: FicheResume;
};

const FicheLieeCard = ({ ficheLiee }: FicheLieeCardProps) => {
  const {
    statut,
    niveauPriorite,
    titre,
    plans,
    pilotes,
    dateFinProvisoire: dateDeFin,
    ameliorationContinue,
    modifiedAt,
  } = ficheLiee;

  const hasPilotes = !!pilotes && pilotes.length > 0;
  const hasDateDeFin = !!dateDeFin;

  const isLate = hasDateDeFin && isBefore(new Date(dateDeFin), startOfToday());

  return (
    <Card wrap={false} gap={1.5} className="w-[31%] p-3">
      {/* Statut et niveau de priorité */}
      <Paragraph className="uppercase">
        {niveauPriorite}
        {niveauPriorite && statut ? ' - ' : ''}
        {statut}
      </Paragraph>

      <Stack gap={1}>
        {/* Titre de la fiche */}
        <Title variant="h6" className="leading-5">
          {generateTitle(titre)}
        </Title>

        {/* Plans d'actions associés */}
        <Paragraph className="text-[0.7rem] text-grey-8 font-medium">
          {!!plans && plans[0] ? (
            <>
              {generateTitle(plans[0].nom)}
              {plans.length > 1 && (
                <Paragraph className="text-primary-8">
                  {' '}
                  +{plans.length - 1}
                </Paragraph>
              )}
            </>
          ) : (
            'Fiche non classée'
          )}
        </Paragraph>
      </Stack>

      {/* Pilotes et date de fin prévisionnelle */}
      {(hasPilotes || hasDateDeFin || ameliorationContinue) && (
        <Stack direction="row" gap={2}>
          {/* Personnes pilote */}
          {hasPilotes && (
            <Paragraph className="text-[0.65rem]">
              {pilotes[0].nom}
              {pilotes.length > 1 && (
                <Paragraph className="text-[0.65rem] text-primary-8">
                  {' '}
                  +{pilotes.length - 1}
                </Paragraph>
              )}
            </Paragraph>
          )}

          {/* Date de fin prévisionnelle */}
          {!!dateDeFin && (
            <>
              {hasPilotes && <Box className="w-[0.5px] h-4 bg-grey-5" />}
              <Paragraph
                className={classNames('text-[0.65rem]', {
                  'text-error-1': isLate,
                })}
              >
                {getTextFormattedDate({
                  date: dateDeFin,
                  shortMonth: true,
                })}
              </Paragraph>
            </>
          )}

          {/* Action récurrente */}
          {!hasDateDeFin && ameliorationContinue && (
            <>
              {hasPilotes && <Box className="w-[0.5px] h-4 bg-grey-5" />}
              <Paragraph className="text-[0.65rem]">Tous les ans</Paragraph>
            </>
          )}
        </Stack>
      )}

      {/* Date de modification */}
      {!!modifiedAt && (
        <Stack gap={1} className="mt-auto">
          <Divider className="h-[0.5px]" />
          <Paragraph className="text-[0.65rem] text-grey-6 font-medium italic">
            Modifié le {format(new Date(modifiedAt), 'dd/MM/yyyy')}
          </Paragraph>
        </Stack>
      )}
    </Card>
  );
};

type FichesLieesProps = {
  fichesLiees: FicheResume[];
};

const FichesLiees = ({ fichesLiees }: FichesLieesProps) => {
  if (fichesLiees.length === 0) return null;

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Fiches des plans liées
      </Title>
      {fichesLiees.length > 0 && (
        <Stack direction="row" className="flex-wrap">
          {fichesLiees.map((ficheLiee) => (
            <FicheLieeCard key={ficheLiee.id} ficheLiee={ficheLiee} />
          ))}
        </Stack>
      )}
    </Card>
  );
};

export default FichesLiees;
