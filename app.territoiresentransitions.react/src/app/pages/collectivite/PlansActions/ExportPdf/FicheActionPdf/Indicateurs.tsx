import classNames from 'classnames';
import { FicheAction } from '@tet/api/plan-actions';
import { IndicateurDefinition } from '@tet/api/indicateurs/domain';
import {
  Badge,
  Card,
  Divider,
  Paragraph,
  Stack,
  Title,
} from 'ui/export-pdf/components';

type IndicateurCardProps = {
  indicateur: IndicateurDefinition;
};

const IndicateurCard = ({ indicateur }: IndicateurCardProps) => {
  const { titre, unite, rempli, participationScore } = indicateur;

  return (
    <Card wrap={false} gap={1.5} className="w-[32%] p-3">
      <Badge
        title={rempli ? 'Complété' : 'À compléter'}
        state={rempli ? 'success' : 'info'}
        size="sm"
        uppercase
      />
      <Title variant="h6" className="leading-5 text-primary-8">
        {titre}
        <Paragraph className="text-grey-6 text-[0.7rem] font-normal">
          {' '}
          ({unite})
        </Paragraph>
      </Title>

      {participationScore && (
        <Stack gap={2} className="mt-auto">
          <Divider className="h-[0.5px]" />
          <Paragraph className="text-[0.65rem] text-grey-6">
            Participe au score Climat Air Énergie
          </Paragraph>
        </Stack>
      )}
    </Card>
  );
};

type IndicateursProps = {
  fiche: FicheAction;
  indicateursListe: IndicateurDefinition[] | undefined | null;
};

const Indicateurs = ({ fiche, indicateursListe }: IndicateursProps) => {
  const { objectifs, resultatsAttendus: effetsAttendus } = fiche;

  const emptyObjectifs = !objectifs || objectifs.length === 0;
  const emptyEffetsAttendus = !effetsAttendus || effetsAttendus.length === 0;

  if (
    emptyObjectifs &&
    emptyEffetsAttendus &&
    (!indicateursListe || indicateursListe.length === 0)
  )
    return null;

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Indicateurs de suivi
      </Title>

      {/* Objectifs */}
      <Paragraph
        className={classNames({
          'text-grey-7': emptyObjectifs,
        })}
      >
        <Paragraph className="text-primary-9 font-bold uppercase">
          Objectifs :{' '}
        </Paragraph>
        {!emptyObjectifs ? objectifs : 'Non renseignés'}
      </Paragraph>

      {/* Effets attendus */}
      <Stack
        gap={emptyEffetsAttendus ? 'px' : 2}
        direction="row"
        className="flex-wrap items-center"
      >
        <Paragraph className="text-primary-9 font-bold uppercase">
          Effets attendus :{' '}
        </Paragraph>
        {emptyEffetsAttendus ? (
          <Paragraph className="text-grey-7">Non renseignés</Paragraph>
        ) : (
          effetsAttendus.map((res) => (
            <Badge key={res.nom} title={res.nom} state="standard" />
          ))
        )}
      </Stack>

      {/* Liste des indicateurs */}
      {indicateursListe && indicateursListe.length > 0 && (
        <Stack gap={2}>
          <Paragraph className="text-primary-9 font-bold uppercase">
            Indicateurs associés :
          </Paragraph>
          <Stack gap={3} direction="row" className="flex-wrap">
            {indicateursListe.map((indicateur) => (
              <IndicateurCard key={indicateur.id} indicateur={indicateur} />
            ))}
          </Stack>
        </Stack>
      )}
    </Card>
  );
};

export default Indicateurs;
