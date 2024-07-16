import {DBClient} from "../../typeUtils";
import {Valeur, valeurSchema} from "../domain/valeur.schema";
import {
    IndicateurDefinition,
    IndicateurDefinitionInsert,
    indicateurDefinitionSchemaInsert
} from "../domain/definition.schema";
import {TablesInsert} from "../../typeUtils";
import {objectToSnake} from "ts-case-convert";
import {Personne} from "../../shared/domain/personne.schema";
import {insertTags} from "../../shared/actions/tag.save";
import {Tag} from "../../shared/domain/tag.schema";
import {Thematique} from '../../shared/domain/thematique.schema';
import {Action} from '../../referentiel/domain/action.schema';
import {
  IndicateurImportSource,
  getValeursComparaison,
} from './indicateur.fetch';
import {selectTags} from '../../shared/actions/tag.fetch';

export type upsertValeursUtilisateurAvecSourceParametres = {
  dbClient: DBClient;
  indicateurId: number;
  collectiviteId: number;
  source: Pick<
    IndicateurImportSource,
    'id' | 'libelle' | 'dateVersion' | 'methodologie'
  >;
  appliquerResultat: boolean;
  appliquerObjectif: boolean;
  ecraserResultat: boolean;
  ecraserObjectif: boolean;
};

/**
 * Modifie la définition d'un indicateur pour une collectivité
 * @param dbClient client supabase
 * @param indicateur indicateur à modifier
 * @param collectiviteId identifiant de la collectivité
 */
export async function updateIndicateurDefinition(
  dbClient: DBClient,
  indicateur: IndicateurDefinition,
  collectiviteId: number
) {
  // Modifier commentaire && confidentiel
  await dbClient.from('indicateur_collectivite').upsert({
    indicateur_id: indicateur.id,
    collectivite_id: collectiviteId,
    commentaire: indicateur.commentaire,
    confidentiel: indicateur.confidentiel,
  });

  // Modifier l'indicateur si personnalise
  if (indicateur.estPerso) {
    await dbClient.from('indicateur_definition').upsert({
      id: indicateur.id,
      collectivite_id: indicateur.collectiviteId,
      titre: indicateur.titre,
      titre_long: indicateur.titreLong,
      description: indicateur.description,
      unite: indicateur.unite,
      borne_max: indicateur.borneMax,
      borne_min: indicateur.borneMin,
    });
  }
}

/**
 * Ajoute un indicateur personnalisé
 * @param dbClient client supabase
 * @param indicateur indicateur à ajouter
 * @return identifiant de l'indicateur ajouté
 */
export async function insertIndicateurDefinition(
  dbClient: DBClient,
  indicateur: IndicateurDefinitionInsert
): Promise<number | null> {
  indicateurDefinitionSchemaInsert.parse(indicateur); // Vérifie le type
  const {data, error} = await dbClient
    .from('indicateur_definition')
    .insert({
      collectivite_id: indicateur.collectiviteId,
      titre: indicateur.titre,
      unite: indicateur.unite ? indicateur.unite : '',
      description: indicateur.description,
    })
    .select('id');

  if (
    data &&
    data.length > 0 &&
    indicateur.thematiques != null &&
    indicateur.thematiques.length > 0
  ) {
    await dbClient.from('indicateur_thematique').insert(
      indicateur.thematiques.map(t => ({
        indicateur_id: data[0].id,
        thematique_id: t.id,
      }))
    );
  }

  if (error) {
    throw error;
  }

  return data ? data[0].id : null;
}

/**
 * Upsert la valeur utilisateur d'un indicateur, supprime la valeur si aucun champ rempli
 * @param dbClient client supabase
 * @param indicateurValeur valeur à ajouter/modifier
 * @return identifiant de la valeur ajoutée/modifiée, null si supprimée
 */
export async function upsertIndicateurValeur(
  dbClient: DBClient,
  indicateurValeur: Valeur
): Promise<number | null> {
  valeurSchema.parse(indicateurValeur); // Vérifie le type
  if (
    indicateurValeur.resultat === null &&
    indicateurValeur.objectif === null &&
    indicateurValeur.estimation === null &&
    (indicateurValeur.resultatCommentaire === null ||
      indicateurValeur.resultatCommentaire === '') &&
    (indicateurValeur.objectifCommentaire === null ||
      indicateurValeur.objectifCommentaire === '')
  ) {
    if (indicateurValeur.id) {
      await dbClient
        .from('indicateur_valeur')
        .delete()
        .eq('id', indicateurValeur.id);
    }
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {annee, ...rest} = indicateurValeur;
  const toUpsert = {
    ...rest,
    dateValeur: new Date(indicateurValeur.annee, 0, 1).toLocaleDateString(),
    source: undefined,
    metadonneeId: rest.source?.id || null,
  };
  const {data, error} = await dbClient
    .from('indicateur_valeur')
    .upsert(objectToSnake(toUpsert) as TablesInsert<'indicateur_valeur'>);
  //.select('id');

  if (error) {
    throw error;
  }

  return data; // && data.length > 0 ? data[0].id : null;
}

/**
 * Modifie les thématiques d'un indicateur
 * @param dbClient client supabase
 * @param indicateur indicateur concerné
 * @param thematiques thématiques à modifier
 */
export async function upsertThematiques(
  dbClient: DBClient,
  indicateur: IndicateurDefinition,
  thematiques: Thematique[]
) {
  if (indicateur.estPerso) {
    // Supprime les liens vers les thématiques qui ne sont plus concernés
    await dbClient
      .from('indicateur_thematique')
      .delete()
      .eq('indicateur_id', indicateur.id)
      .not('thematique_id', 'in', `(${thematiques.map(t => t.id).join(',')})`);

    // Fait les nouveaux liens entre l'indicateur et les thématiques
    await dbClient.from('indicateur_thematique').upsert(
      thematiques.map(t => ({
        thematique_id: t.id,
        indicateur_id: indicateur.id,
      })),
      {onConflict: 'indicateur_id,thematique_id'}
    );
  }
}

/**
 * Modifie les services d'un indicateur
 * @param dbClient client supabase
 * @param indicateur indicateur concerné
 * @param collectiviteId identifiant de la collectivité concernée
 * @param services services à modifier
 */
export async function upsertServices(
  dbClient: DBClient,
  indicateur: IndicateurDefinition,
  collectiviteId: number,
  services: Tag[]
) {
  const tagIds: number[] = [];
  const newTags: Tag[] = [];

  services.forEach(s => {
    if (s.id) {
      tagIds.push(s.id as number);
    } else if (s.nom) {
      newTags.push(s);
    }
  });

  // Supprime les services qui ne sont plus concernés
  await dbClient
    .from('indicateur_service_tag')
    .delete()
    .eq('indicateur_id', indicateur.id)
    .eq('collectivite_id', collectiviteId)
    .not('service_tag_id', 'in', `(${tagIds.join(',')})`);

  // Ajoute les nouveaux tags
  const newTagsAdded: Tag[] = await insertTags(dbClient, 'service', newTags);

  // Fait les nouveaux liens entre l'indicateur et les pilotes
  const toUpsert = tagIds
    .concat(newTagsAdded.map(t => t.id as number))
    .map(s => ({
      collectivite_id: collectiviteId,
      indicateur_id: indicateur.id,
      service_tag_id: s,
    }));

  await dbClient.from('indicateur_service_tag').upsert(toUpsert, {
    onConflict: 'indicateur_id, collectivite_id, service_tag_id',
  });
}

/**
 * Modifie les categories utilisateur d'un indicateur
 * @param dbClient client supabase
 * @param indicateur indicateur concerné
 * @param collectiviteId identifiant de la collectivité concernée
 * @param categories categories à modifier
 */
export async function upsertCategoriesUtilisateur(
  dbClient: DBClient,
  indicateur: IndicateurDefinition,
  collectiviteId: number,
  categories: Tag[]
) {
  const tagIds: number[] = [];
  const newTags: Tag[] = [];
  const categoriesCollectivite = await selectTags(
    dbClient,
    collectiviteId,
    'categorie'
  );

  categories.forEach(s => {
    if (s.id) {
      tagIds.push(s.id as number);
    } else if (s.nom && s.collectiviteId === collectiviteId) {
      newTags.push(s);
    }
  });

  // Supprime les categories qui ne sont plus concernés
  await dbClient
    .from('indicateur_categorie_tag')
    .delete()
    .eq('indicateur_id', indicateur.id)
    // Ne supprime que les catégories de la collectivité
    .in(
      'categorie_tag_id',
      categoriesCollectivite.map(c => c.id)
    )
    .not('categorie_tag_id', 'in', `(${tagIds.join(',')})`);

  // Ajoute les nouveaux tags
  const newTagsAdded: Tag[] = await insertTags(dbClient, 'categorie', newTags);

  // Fait les nouveaux liens entre l'indicateur et les pilotes
  const toUpsert = tagIds
    .concat(newTagsAdded.map(t => t.id as number))
    .map(s => ({indicateur_id: indicateur.id, categorie_tag_id: s}));

  await dbClient.from('indicateur_categorie_tag').upsert(toUpsert, {
    onConflict: 'indicateur_id, categorie_tag_id',
  });
}

/**
 * Modifie les pilotes d'un indicateur
 * @param dbClient client supabase
 * @param indicateur indicateur concerné
 * @param collectiviteId identifiant de la collectivité
 * @param pilotes liste des pilotes à upsert
 */
export async function upsertPilotes(
  dbClient: DBClient,
  indicateur: IndicateurDefinition,
  collectiviteId: number,
  pilotes: Personne[]
) {
  const passageIds: number[] = [];
  const userIds: string[] = [];
  const tagIds: number[] = [];
  const newTags: Tag[] = [];
  pilotes.forEach(p => {
    if (p.idTablePassage) {
      passageIds.push(p.idTablePassage);
    } else if (p.tagId) {
      tagIds.push(p.tagId as number);
    } else if (p.userId) {
      userIds.push(p.userId as string);
    } else if (p.nom) {
      newTags.push({collectiviteId: collectiviteId, nom: p.nom as string});
    }
  });
  // Supprime les liens vers les pilotes qui ne sont plus concernés
  await dbClient
    .from('indicateur_pilote')
    .delete()
    .eq('indicateur_id', indicateur.id)
    .eq('collectivite_id', collectiviteId)
    .not('id', 'in', `(${passageIds.join(',')})`);

  // Ajoute les nouveaux tags personne
  const newTagsAdded: Tag[] = await insertTags(dbClient, 'personne', newTags);

  // Fait les nouveaux liens entre l'indicateur et les pilotes
  const toUpsert = [
    ...userIds.map(p => ({user_id: p, tag_id: null})),
    ...tagIds
      .concat(newTagsAdded.map(t => t.id as number))
      .map(p => ({user_id: null, tag_id: p})),
  ].map(p => ({
    ...p,
    collectivite_id: collectiviteId,
    indicateur_id: indicateur.id,
  }));

  // Sauvegarde les nouveaux pilotes
  if (toUpsert.length > 0) {
    await dbClient.from('indicateur_pilote').upsert(toUpsert, {
      onConflict: 'indicateur_id, collectivite_id, user_id, tag_id',
    });
  }
}

/**
 * Modifie les fiches d'un indicateur
 * @param dbClient client supabase
 * @param indicateur indicateur concerné
 * @param collectiviteId identifiant de la collectivité
 * @param fiches fiches à modifier
 */
export async function upsertFiches(
  dbClient: DBClient,
  indicateurId: number,
  collectiviteId: number,
  fiches: number[]
) {
  const requestCol = await dbClient
    .from('fiche_action')
    .select('id')
    .eq('collectivite_id', collectiviteId);
  const fichesCol: number[] = requestCol.data?.map(r => r.id) || [];
  if (fichesCol.length > 0) {
    // Supprime les liens vers les fiches qui ne sont plus concernés
    await dbClient
      .from('fiche_action_indicateur')
      .delete()
      .eq('indicateur_id', indicateurId)
      .in('fiche_id', fichesCol)
      .not('fiche_id', 'in', `(${fiches.join(',')})`);
  }

  // Fait les nouveaux liens entre l'indicateur et les fiches
  await dbClient.from('fiche_action_indicateur').upsert(
    fiches.map(fiche_id => ({fiche_id, indicateur_id: indicateurId})),
    {onConflict: 'indicateur_id,fiche_id'}
  );
}

/**
 * Modifie les actions d'un indicateur
 * @param dbClient client supabase
 * @param indicateur indicateur concerné
 * @param actions actions à modifier
 */
export async function upsertActions(
  dbClient: DBClient,
  indicateur: IndicateurDefinition,
  actions: Action[]
) {
  if (indicateur.estPerso) {
    // Supprime les liens vers les actions qui ne sont plus concernés
    await dbClient
      .from('indicateur_action')
      .delete()
      .eq('indicateur_id', indicateur.id)
      .not('action_id', 'in', `(${actions.map(a => a.id).join(',')})`);

    // Fait les nouveaux liens entre l'indicateur et les fiches
    await dbClient.from('indicateur_action').upsert(
      actions.map(a => ({action_id: a.id, indicateur_id: indicateur.id})),
      {onConflict: 'indicateur_id,action_id'}
    );
  }
}

/**
 * Applique les valeurs d'une source aux valeurs utilisateurs d'un indicateur
 * @param args upsertValeursUtilisateurAvecSourceParametres <ul>
 *<li><u>dbClient</u> : client supabase</li>
 *<li><u>indicateurId</u> : identifiant de l'indicateur</li>
 *<li><u>collectiviteId</u>: identifiant de la collectivite</li>
 *<li><u>source</u> : source à appliquer</li>
 *<li><u>appliquerResultat</u> : vrai pour appliquer les résultats de la source</li>
 *<li><u>appliquerObjectif</u> : vrai pour appliquer les objectifs de la source</li>
 *<li><u>ecraserResultat</u> : vrai pour écraser les résultats existants utilisateur par ceux de la source</li>
 *<li><u>ecraserObjectif</u> : vrai pour écraser les objectifs existants utilisateur par ceux de la source</li>
 *</ul>
 */
export async function upsertValeursUtilisateurAvecSource(
  args: upsertValeursUtilisateurAvecSourceParametres
) {
  const valeurs = await getValeursComparaison(
    args.dbClient,
    args.indicateurId,
    args.collectiviteId,
    args.source.id
  );
  const valeursToUpsert: Map<number, Valeur> = new Map<number, Valeur>();

  if (valeurs) {
    const commentaire = [
      args.source.libelle,
      !!args.source.dateVersion &&
        new Date(args.source.dateVersion)?.getFullYear(),
      args.source.methodologie,
    ]
      .filter(s => !!s)
      .join(', ');
    if (args.appliquerResultat) {
      for (const ligne of valeurs.resultats.lignes) {
        // Si nouvelle ligne, ou nouveau résultat qu'on écrase
        if (!ligne.idAEcraser || (ligne.conflit && args.ecraserResultat)) {
          const valeurToUpsert: Valeur = {
            id: ligne.idAEcraser ? ligne.idAEcraser : undefined,
            indicateurId: args.indicateurId,
            annee: ligne.annee,
            collectiviteId: args.collectiviteId,
            source: null,
            resultat: ligne.valeurAAppliquer,
          };
          if (!ligne.idAEcraser)
            valeurToUpsert.resultatCommentaire = commentaire;
          valeursToUpsert.set(ligne.annee, valeurToUpsert);
        }
      }
    }
    if (args.appliquerObjectif) {
      for (const ligne of valeurs.objectifs.lignes) {
        if (!ligne.idAEcraser || (ligne.conflit && args.ecraserObjectif)) {
          const valeurFromResultat = valeursToUpsert.get(ligne.annee);
          const valeurToUpsert: Valeur = valeurFromResultat
            ? valeurFromResultat
            : {
                id: ligne.idAEcraser ? ligne.idAEcraser : undefined,
                indicateurId: args.indicateurId,
                annee: ligne.annee,
                collectiviteId: args.collectiviteId,
                source: null,
                objectif: ligne.valeurAAppliquer,
              };
          if (!ligne.idAEcraser)
            valeurToUpsert.objectifCommentaire = commentaire;
          valeursToUpsert.set(ligne.annee, valeurToUpsert);
        }
      }
    }

    // TODO faire un upsert de plusieurs valeurs en une fois
    await Promise.all(
      [...valeursToUpsert.values()].map(v =>
        upsertIndicateurValeur(args.dbClient, v)
      )
    );
  }
}


