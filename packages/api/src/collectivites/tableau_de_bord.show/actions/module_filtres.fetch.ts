import {DBClient} from '../../../typeUtils';
import {
  Filtre,
  filtreSchema,
  filtreValueSchema,
} from '../../../fiche_actions/shared/domain/filtre.schema';
import {z} from 'zod';
import {objectToCamel} from 'ts-case-convert';

const outputSchema = filtreValueSchema;
type Output = z.infer<typeof outputSchema>;

type Input = {
  dbClient: DBClient;
  collectiviteId: number;
  filtre: Filtre;
};

export async function moduleFiltresFetch({
  dbClient,
  collectiviteId,
  filtre: unsafeFiltre,
}: Input) {
  const filtre = filtreSchema.parse(unsafeFiltre);

  try {
    // 1. Ajoute les tables liées correspondant aux filtres
    // 👇

    const relatedTables = new Set<string>();

    if (filtre.planActionIds?.length) {
      relatedTables.add('plans:collectivite_axe!inner(*)');
    }

    if (filtre.utilisateurPiloteIds?.length) {
      relatedTables.add('utilisateurPilotes:collectivite_utilisateur!inner(*)');
    }

    if (filtre.personnePiloteIds?.length) {
      relatedTables.add('personnePilotes:collectivite_personne_tag!inner(*)');
    }

    if (filtre.structurePiloteIds?.length) {
      relatedTables.add('structurePilotes:collectivite_structure_tag!inner(*)');
    }

    if (filtre.servicePiloteIds?.length) {
      relatedTables.add('servicePilotes:collectivite_service_tag!inner(*)');
    }

    if (relatedTables.size === 0) {
      return {data: {}};
    }

    // 2. Crée la requête avec les tables liées
    // 👇

    const query = dbClient
      .from('collectivite')
      .select([...relatedTables].join(','))
      .eq('id', collectiviteId)
      .limit(1);

    // 3. Ajoute les clauses correspondant aux filtres
    // 👇

    if (filtre.planActionIds?.length) {
      query.in('collectivite_axe.id', filtre.planActionIds);
    }

    if (filtre.utilisateurPiloteIds?.length) {
      query.in('collectivite_utilisateur.user_id', filtre.utilisateurPiloteIds);
    }

    if (filtre.personnePiloteIds?.length) {
      query.in('collectivite_personne_tag.id', filtre.personnePiloteIds);
    }

    if (filtre.structurePiloteIds?.length) {
      query.in('collectivite_structure_tag.id', filtre.structurePiloteIds);
    }

    if (filtre.servicePiloteIds?.length) {
      query.in('collectivite_service_tag.id', filtre.servicePiloteIds);
    }

    const {data, error} = await query.returns<Output>().single();

    if (error) {
      throw error;
    }

    return {data: objectToCamel(data)};
  } catch (error) {
    console.error(error);
    return {error};
  }
}
