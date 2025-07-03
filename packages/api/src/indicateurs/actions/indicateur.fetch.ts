import { Personne } from '@/api/collectivites';
import { Source, SourceMetadonnee } from '@/domain/indicateurs';
import { Thematique } from '@/domain/shared';
import { objectToCamel } from 'ts-case-convert';
import {
    selectGroupementParCollectivite,
    selectGroupements,
} from '../../collectivites/shared/data-access/groupement.fetch';
import { Groupement } from '../../collectivites/shared/domain/groupement.schema';
import { Tables } from '../../database.types';
import { DBClient } from '../../typeUtils';
import {
    IndicateurChartInfo,
    IndicateurDefinition,
} from '../domain/definition.schema';
import {
    Valeur,
    ValeurComparaison,
    ValeurComparaisonLigne,
} from '../domain/valeur.schema';

// cas spécial pour cet indicateur TODO: utiliser un champ distinct dans les markdowns plutôt que cet ID "en dur"
const ID_COMPACITE_FORMES_URBAINES = 'cae_9';

const COLONNES_VALEURS = [
  'id',
  'resultat',
  'objectif',
  'resultat_commentaire',
  'objectif_commentaire',
  'date_valeur',
  'collectivite_id',
  'indicateur_id',
  'source:indicateur_source_metadonnee(*)',
] as const;

const COLONNES_DEFINITION_COURTE = [
  'id',
  'titre',
  'titre_long',
  'unite',
  'participation_score',
  'sans_valeur:sans_valeur_utilisateur',
  'identifiant:identifiant_referentiel',
] as const;

const COLONNES_DEFINITION = [
  ...COLONNES_DEFINITION_COURTE,
  'collectivite_id',
  'description',
  'borne_min',
  'borne_max',
  'plus:indicateur_collectivite(commentaire, confidentiel)',
  'actions:indicateur_action(...action_relation(*))',
  'thematiques:indicateur_thematique(...thematique_id(*))',
  'categories:indicateur_categorie_tag(...categorie_tag(id,nom,collectivite_id,groupement_id, groupement(groupement_collectivite(*))))',
  'valeurs:indicateur_valeur(' + `${COLONNES_VALEURS.join(',')}` + ')',
  'enfants:indicateur_enfants(id, groupement_id)',
  'parents:indicateur_parents(id)',
  'modified_at',
] as const;

/**
 * Récupère les sources disponibles pour un indicateur et une collectivité
 * @param dbClient client supabase
 * @param indicateurId identifiant de l'indicateur
 * @param collectiviteId identifiant de la collectivité
 * @return liste des sources
 */
// type des données retournées
export type IndicateurImportSource = Awaited<
  ReturnType<typeof selectIndicateurSources>
>[0];

// type des données lues (<!> changer cette définition si la liste des colonnes lues change)
type IndicateurSource = Source &
  Omit<SourceMetadonnee, 'id'> &
  Pick<Valeur, 'objectif' | 'resultat'>;

export async function selectIndicateurSources(
  dbClient: DBClient,
  indicateurId: number,
  collectiviteId: number
) {
  const { data } = await dbClient
    .from('indicateur_valeur')
    .select(
      'objectif,resultat,...indicateur_source_metadonnee(*, ...indicateur_source(*))'
    )
    .eq('indicateur_id', indicateurId)
    .eq('collectivite_id', collectiviteId)
    .returns<IndicateurSource[]>();

  // fait le décompte des valeurs objectif et résultat pour chaque source
  const sourcesById: Record<
    string,
    { objectifs: number; resultats: number; source: IndicateurSource }
  > = {};

  data?.forEach((source) => {
    if (!source.id) return;
    sourcesById[source.id] = sourcesById[source.id] || {
      objectifs: 0,
      resultats: 0,
      source: objectToCamel(source),
    };
    if (typeof source.objectif === 'number') sourcesById[source.id].objectifs++;
    if (typeof source.resultat === 'number') sourcesById[source.id].resultats++;
  });

  return Object.values(sourcesById)
    .map(({ objectifs, resultats, source }) => ({
      ...source,
      // TODO: gérer les sources contenant des objectifs ET des résultats ?
      type:
        objectifs > 0
          ? ('objectif' as const)
          : resultats > 0
          ? ('resultat' as const)
          : null,
    }))
    .sort((a, b) => (a.ordreAffichage || 0) - (b.ordreAffichage || 0));
}

/**
 * Récupère les catégories tags d'une collectivité et d'un indicateur
 * @param dbClient client supabase
 * @param indicateurId identifiant de l'indicateur
 * @param collectiviteId identifiant de la collectivité
 * @return liste des identifiants des tags
 */
export async function selectIndicateurCategoriesUtilisateur(
  dbClient: DBClient,
  indicateurId: number,
  collectiviteId: number
): Promise<number[]> {
  const { data } = await dbClient
    .from('indicateur_categorie_tag')
    .select('...categorie_tag!inner(id, collectivite_id)')
    .eq('indicateur_id', indicateurId)
    .eq('categorie_tag.collectivite_id', collectiviteId)
    .returns<Array<Tables<'categorie_tag'>>>();

  return (data?.map((cat) => cat.id) as number[]) || [];
}

/**
 * Récupère les pilotes d'un indicateur mis par une collectivité
 * @param dbClient client supabase
 * @param indicateurId identifiant de l'indicateur
 * @param collectiviteId identifiant de la collectivité
 * @return liste de pilotes
 */
export async function selectIndicateurPilotes(
  dbClient: DBClient,
  indicateurId: number,
  collectiviteId: number
): Promise<Personne[]> {
  const { data } = await dbClient
    .from('indicateur_pilote')
    .select(
      `id, collectivite_id, user_id, tag_id, tag:personne_tag(*), user:indicateur_pilote_user(*)`
    )
    .eq('indicateur_id', indicateurId)
    .eq('collectivite_id', collectiviteId)
    .returns<any[]>();

  if (!data) {
    return [];
  }
  return data.map((p) => {
    return {
      collectiviteId: p.collectivite_id,
      userId: p.user_id,
      tagId: p.tag_id,
      nom: p.tag_id ? p.tag.nom : p.user.prenom + ' ' + p.user.nom,
      idTablePassage: p.id,
    };
  });
}

/**
 * Récupère les identifiants des tags services d'un indicateur et d'une collectivité
 * @param dbClient client supabase
 * @param indicateurId identifiant de l'indicateur
 * @param collectiviteId identifiant de la collectivité
 * @return liste d'id de tags services
 */
export async function selectIndicateurServicesId(
  dbClient: DBClient,
  indicateurId: number,
  collectiviteId: number
): Promise<number[]> {
  const { data } = await dbClient
    .from('indicateur_service_tag')
    .select(`service_tag_id`)
    .eq('indicateur_id', indicateurId)
    .eq('collectivite_id', collectiviteId);

  return data?.map((d) => d.service_tag_id) || [];
}

/**
 * Récupère les identifiants des thématiques d'un indicateur
 * @param dbClient client supabase
 * @param indicateurId identifiant de l'indicateur
 * @return liste des identifiants des thématiques
 */
export async function selectIndicateurThematiquesId(
  dbClient: DBClient,
  indicateurId: number
): Promise<number[]> {
  const { data } = await dbClient
    .from('indicateur_thematique')
    .select(`thematique_id`)
    .eq('indicateur_id', indicateurId);

  return data?.map((d) => d.thematique_id) || [];
}

/**
 * Récupère les identifiants des thématiques d'un indicateur
 * @param dbClient client supabase
 * @param indicateurId identifiant de l'indicateur
 * @return liste des thématiques
 */
export async function selectIndicateurThematiques(
  dbClient: DBClient,
  indicateurId: number
): Promise<Thematique[]> {
  const { data } = await dbClient
    .from('indicateur_thematique')
    .select(`...thematique!inner(id,nom)`)
    .eq('indicateur_id', indicateurId)
    .returns<Thematique[]>();

  return data || [];
}

/**
 * Récupère la liste des id des indicateurs favoris de la collectivité
 * @param dbClient
 * @param collectiviteId
 * @returns
 */
export async function selectIndicateursFavorisCollectiviteIds(
  dbClient: DBClient,
  collectiviteId: number
) {
  return await dbClient
    .from('indicateur_collectivite')
    .select(`indicateur_id`, { count: 'exact' })
    .eq('collectivite_id', collectiviteId)
    .eq('favoris', true);
}

/**
 * Récupère les valeurs d'un indicateur
 * @param dbClient client supabase
 * @param indicateurId identifiant de l'indicateur
 * @param collectiviteId identifiant de la collectivité
 * @param source nom de la source des valeurs à récupérer, null pour les valeurs utilisateurs
 * @return liste de valeurs
 */
export async function selectIndicateurValeurs(
  dbClient: DBClient,
  indicateurId: number,
  collectiviteId: number,
  source: string | null
): Promise<Valeur[]> {
  const { data } = await dbClient
    .from('indicateur_valeur')
    .select(`${COLONNES_VALEURS.join(',')}`)
    .eq('indicateur_id', indicateurId)
    .eq('collectivite_id', collectiviteId)
    .order('date_valeur', { ascending: false });
  let toReturn;
  if (!source) {
    // Récupère les valeurs renseignées par l'utilisateur (sans source)
    toReturn =
      data?.filter(
        (val: any) => val.source === null || val.source.length === 0
      ) || [];
  } else {
    // Récupère les valeurs de la source donnée (garde que la dernière si conflit sur la date)
    const valeursSource =
      data?.filter(
        (val: any) => val.source && val.source.source_id === source
      ) || [];
    const groupeParAnneeResultat: Map<number, any[]> = new Map<number, any[]>();
    const groupeParAnneeObjectif: Map<number, any[]> = new Map<number, any[]>();
    const groupeParAnneeEstimation: Map<number, any[]> = new Map<
      number,
      any[]
    >();
    valeursSource.forEach((val: any) => {
      // Tri les valeurs par an
      // Tri séparément les valeurs ayant des résultats, des objectifs, et des estimations
      const annee = new Date(val.date_valeur).getFullYear();
      if (typeof val.resultat === 'number' || val.resultat_commentaire) {
        if (!groupeParAnneeResultat.get(annee))
          groupeParAnneeResultat.set(annee, []);
        groupeParAnneeResultat.get(annee)!.push(val);
      }
      if (typeof val.objectif === 'number' || val.objectif_commentaire) {
        if (!groupeParAnneeObjectif.get(annee))
          groupeParAnneeObjectif.set(annee, []);
        groupeParAnneeObjectif.get(annee)!.push(val);
      }
      if (val.estimation) {
        if (!groupeParAnneeEstimation.get(annee))
          groupeParAnneeEstimation.set(annee, []);
        groupeParAnneeEstimation.get(annee)!.push(val);
      }
    });
    const maps = [
      groupeParAnneeResultat,
      groupeParAnneeObjectif,
      groupeParAnneeEstimation,
    ];
    toReturn = [];
    const ids = [];
    for (let m = 0; m < maps.length; m++) {
      const map = maps[m];
      for (const annee of map.keys()) {
        const plusRecente = map
          .get(annee)!
          .reduce((a, b) =>
            new Date(a.source.date_version) > new Date(b.source.date_version)
              ? a
              : b
          );
        if (!ids[plusRecente.id]) {
          toReturn.push(plusRecente);
          ids.push(plusRecente.id);
        }
      }
    }
  }
  toReturn = data ? dateEnAnnee(toReturn, true) : [];
  return objectToCamel(toReturn) as Valeur[];
}

/**
 * Récupère la valeur pour une année/source
 * @param dbClient client supabase
 * @param valeurId identifiant de la valeur
 * @return valeur
 */
export async function selectIndicateurValeur(
  dbClient: DBClient,
  valeurId: number
): Promise<Valeur | null> {
  const { data } = await dbClient
    .from('indicateur_valeur')
    .select(`${COLONNES_VALEURS.join(',')}`)
    .eq('id', valeurId);

  const toReturn = data ? dateEnAnnee(data, false) : null;
  return toReturn ? (objectToCamel(toReturn)[0] as Valeur) : null;
}

/**
 * Récupère la définition d'un indicateur pour une collectivité
 * @param dbClient client supabase
 * @param indicateurId identifiant de l'indicateur
 * @param collectiviteId identifiant de la collectivité
 * @return indicateur
 */
export async function selectIndicateurDefinition(
  dbClient: DBClient,
  indicateurId: number,
  collectiviteId: number
): Promise<IndicateurDefinition | null> {
  const data = await selectIndicateurDefinitions(
    dbClient,
    [indicateurId],
    collectiviteId
  );
  return data?.[0] || null;
}

/**
 * Récupère les définitions des indicateurs pour une collectivité
 * @param dbClient client supabase
 * @param indicateurId identifiants des indicateurs voulus
 * @param collectiviteId identifiant de la collectivité
 * @return indicateur
 */
export async function selectIndicateurDefinitions(
  dbClient: DBClient,
  indicateurIds: number[],
  collectiviteId: number
): Promise<IndicateurDefinition[] | null> {
  const { data } = await dbClient
    .from('indicateur_definition')
    .select(COLONNES_DEFINITION.join(','))
    .in('id', indicateurIds)
    .eq('plus.collectivite_id', collectiviteId)
    .eq('valeurs.collectivite_id', collectiviteId);

  const toReturn = data
    ? await transformeDefinition(dbClient, data, collectiviteId, false)
    : null;

  return toReturn ? (objectToCamel(toReturn) as IndicateurDefinition[]) : null;
}

/**
 * Récupère la définition d'un indicateur à partir de son identifiant référentiel
 * @param dbClient client supabase
 * @param identifiant identifiant de l'indicateur voulu
 * @param collectiviteId identifiant de la collectivité
 * @return indicateur
 */
export async function selectIndicateurReferentielDefinition(
  dbClient: DBClient,
  identifiant: string | undefined,
  collectiviteId: number
): Promise<IndicateurDefinition | null> {
  if (identifiant === undefined) return null;

  const data = await selectIndicateurReferentielDefinitions(
    dbClient,
    [identifiant],
    collectiviteId
  );
  return data?.[0] || null;
}

// idem mais pour plusieurs identifiants référentiel
export async function selectIndicateurReferentielDefinitions(
  dbClient: DBClient,
  identifiants: string[],
  collectiviteId: number
): Promise<IndicateurDefinition[] | null> {
  if (!identifiants?.length) return null;

  const { data } = await dbClient
    .from('indicateur_definition')
    .select(COLONNES_DEFINITION.join(','))
    .in('identifiant_referentiel', identifiants)
    .eq('plus.collectivite_id', collectiviteId)
    .eq('valeurs.collectivite_id', collectiviteId);
  const toReturn = data
    ? await transformeDefinition(dbClient, data, collectiviteId, false)
    : null;
  return toReturn ? (objectToCamel(toReturn) as IndicateurDefinition[]) : null;
}

/**
 * Récupère les informations d'un indicateur pour un affichage graphique
 * @param dbClient client supabase
 * @param indicateurId l'identifiant de l'indicateur
 * @param collectiviteId identifiant de la collectivité
 * @return l'indicateur et ses valeurs pour un affichage graphique
 */
export async function selectIndicateurChartInfo(
  dbClient: DBClient,
  indicateurId: number,
  collectiviteId: number
): Promise<IndicateurChartInfo | null> {
  const { data } = await dbClient
    .from('indicateur_definition')
    .select(
      `${COLONNES_DEFINITION_COURTE.join(',')}, groupement_id,` +
        'plus:indicateur_collectivite(confidentiel, favoris, collectivite_id), ' +
        'enfants:indicateur_enfants(' +
        'id, ' +
        'valeurs:indicateur_valeur(date_valeur, resultat, objectif, collectivite_id, metadonnee_id)' +
        '), ' +
        'valeurs:indicateur_valeur(date_valeur, resultat, objectif, collectivite_id, metadonnee_id)'
    )
    .eq('id', indicateurId)
    .eq('plus.collectivite_id', collectiviteId)
    .eq('indicateur_valeur.collectivite_id', collectiviteId)
    .is('valeurs.metadonnee_id', null)
    .eq('indicateur_enfants.indicateur_valeur.collectivite_id', collectiviteId)
    .is('indicateur_enfants.indicateur_valeur.metadonnee_id', null)
    .returns<any[]>();

  const groupement: Groupement[] = await selectGroupementParCollectivite(
    dbClient,
    collectiviteId
  );
  const groupementIds = groupement.map((gp) => gp.id);
  const toReturn =
    data
      ?.filter(
        (item: any) =>
          item.groupement_id === null ||
          groupementIds.includes(item.groupement_id)
      )
      .map((item) => {
        // Récupère l'information de la confidentialité et favori de la collectivité
        const plusInfo =
          item.plus && item.plus[0]
            ? item.plus[0]
            : {
                confidentiel: false,
                favoris: false,
                collectiviteId,
              };

        // Transforme les valeurs
        let valeursTransforme = dateEnAnnee(item.valeurs, true);

        // Vérifie le remplissage des indicateurs enfants
        let enfantsTransforme = item.enfants.map((enf: any) => {
          return {
            ...enf,
            valeurs: enf.valeurs,
            rempli: enf.valeurs.length > 0,
          };
        });

        let count = null;
        let total = null;
        // Pour un indicateur composé n'ayant pas ses propres valeurs
        if (item.sans_valeur && enfantsTransforme.length > 0) {
          // On compte le nombre d'enfants total et remplis
          count = enfantsTransforme.filter((enf: any) => enf.rempli).length;
          total = enfantsTransforme.length;

          // Si tous les enfants sont remplis ou si au moins un est rempli pour l'indicateur parent cae_9
          if (
            count === total ||
            (item.identifiant === ID_COMPACITE_FORMES_URBAINES && count >= 1)
          ) {
            // On affiche les valeurs du premier enfant rempli
            const premierRempli = enfantsTransforme.find(
              (enf: any) => enf.rempli
            );
            valeursTransforme = dateEnAnnee(premierRempli.valeurs, true);
          }
        }
        // On enlève l'attribut valeurs des enfants pour correspondre au schéma
        enfantsTransforme = enfantsTransforme.map((enf: any) => {
          return {
            ...enf,
            valeurs: undefined,
          };
        });

        return {
          ...item,
          valeurs: valeursTransforme,
          rempli: item.valeurs.length > 0, // Ajoute l'attribut 'rempli'
          enfants: enfantsTransforme,
          plus: undefined,
          confidentiel: plusInfo.confidentiel, // Remonte l'info 'confidentiel'
          favoriCollectivite: plusInfo.favoris, // Remonte l'info 'confidentiel'
          count: count, // Ajoute l'attribut 'count'
          total: total, // Ajoute l'attribut 'total'
          identifiant: undefined, // Enlève 'identifiant' pour correspondre au schéma
          groupement_id: undefined, // Enlève l'information du groupement
        };
      }) || null;

  return toReturn ? (objectToCamel(toReturn)[0] as IndicateurChartInfo) : null;
}

/**
 * Modifie une liste de valeurs d'indicateurs pour transformer date_valeur (date) en année (nombre)
 * @param data liste de valeurs avec date_valeur (date)
 * @param enleveDoublon si vrai, enlève les valeurs avec la même année
 * @return liste de valeurs avec annee (nombre)
 */
function dateEnAnnee(data: any[], enleveDoublon: boolean) {
  // En base de donnée l'année d'une valeur est sous forme de date 01/01/XXXX pour laisser la possibilité future
  // d'avoir des évolutions de valeurs par semestre, mois, etc.
  // Actuellement l'application n'affiche qu'une évolution par année, on transforme donc la date en année
  // Dans le cas où il y aurait éventuellement plusieurs dates sur la même année en BDD,
  // on ne garde que les valeurs sous la forme 01/01/XXXX
  const toTransforme = enleveDoublon
    ? data.filter(
        (val: any) =>
          new Date(val.date_valeur).getMonth() === 0 &&
          new Date(val.date_valeur).getDate() === 1
      )
    : data;
  return toTransforme.map((val: any) => {
    return {
      ...val,
      annee: new Date(val.date_valeur).getFullYear(),
      date_valeur: undefined,
    };
  });
}

/**
 * Compare les valeurs de l'utilisateur et de la source d'un indicateur
 * @param dbClient client supabase
 * @param indicateurId identifiant de l'indicateur
 * @param collectiviteId identifiant de la collectivité
 * @param source source à comparer
 * @return liste des valeurs résultats et objectifs à comparer
 */
export async function getValeursComparaison(
  dbClient: DBClient,
  indicateurId: number,
  collectiviteId: number,
  source: string
): Promise<{
  resultats: ValeurComparaison;
  objectifs: ValeurComparaison;
} | null> {
  const valeursUtilisateur = await selectIndicateurValeurs(
    dbClient,
    indicateurId,
    collectiviteId,
    null
  );
  const valeursSource = await selectIndicateurValeurs(
    dbClient,
    indicateurId,
    collectiviteId,
    source
  );

  if (!valeursSource.length) {
    // rien à appliquer
    return null;
  }

  // Pour compter les lignes en conflit
  let nbConflitsResultat = 0;
  let nbConflitsObjectif = 0;
  // et celles à insérer
  let nbAjoutsResultat = 0;
  let nbAjoutsObjectif = 0;

  const lignesResultat: ValeurComparaisonLigne[] = [];
  const lignesObjectif: ValeurComparaisonLigne[] = [];

  // Parcours chaque ligne à appliquer
  valeursSource.map((aAppliquer) => {
    // cherche si une valeur a déjà été saisie pour la même année
    const aEcraser = valeursUtilisateur?.find(
      (d) => d.annee === aAppliquer.annee
    );
    const ligneCommune: ValeurComparaisonLigne = {
      conflit: false,
      annee: aAppliquer.annee,
      idAEcraser: aEcraser?.id ?? null,
      idAAppliquer: aAppliquer.id!,
      valeurAEcraser: null,
      valeurAAppliquer: 0,
      source: source,
    };
    // Ajout d'une ligne résultat
    if (typeof aAppliquer.resultat === 'number') {
      const ligne: ValeurComparaisonLigne = {
        ...ligneCommune,
        valeurAEcraser: aEcraser?.resultat ?? null,
        valeurAAppliquer: aAppliquer.resultat!,
      };
      // Ajoute l'information du conflit
      ligne.conflit = ligne.valeurAEcraser
        ? ligne.valeurAEcraser !== ligne.valeurAAppliquer
        : false;
      if (ligne.conflit) nbConflitsResultat++;
      if (ligne.valeurAEcraser === null) nbAjoutsResultat++;
      lignesResultat.push(ligne);
    }
    // Ajout d'une ligne objectif
    if (typeof aAppliquer.objectif === 'number') {
      const ligne = {
        ...ligneCommune,
        valeurAEcraser: aEcraser?.objectif ?? null,
        valeurAAppliquer: aAppliquer.objectif!,
      };
      // Ajoute l'information du conflit
      ligne.conflit = ligne.valeurAEcraser
        ? ligne.valeurAEcraser !== ligne.valeurAAppliquer
        : false;
      if (ligne.conflit) nbConflitsObjectif++;
      if (ligne.valeurAEcraser === null) nbAjoutsObjectif++;
      lignesObjectif.push(ligne);
    }
  });

  // renvoi le nombre et le détail des conflits relevés
  return {
    resultats: {
      lignes: lignesResultat,
      conflits: nbConflitsResultat,
      ajouts: nbAjoutsResultat,
    },
    objectifs: {
      lignes: lignesObjectif,
      conflits: nbConflitsObjectif,
      ajouts: nbAjoutsObjectif,
    },
  };
}

/**
 * Modifie une liste d'indicateur pour coller aux schémas
 * @param dbClient client supabase
 * @param data liste d'indicateurs
 * @param collectiviteId identifiant de la collectivité
 * @param complet vrai si la liste d'indicateur contient tous les attributs annexes
 */
async function transformeDefinition(
  dbClient: DBClient,
  data: any[],
  collectiviteId: number,
  complet: boolean
) {
  const groupement = await selectGroupements(dbClient);
  return data.map((item) => {
    // Extraire les informations de 'plus' si elles existent
    const plusInfo =
      item.plus && item.plus[0]
        ? item.plus[0]
        : {
            commentaire: null,
            confidentiel: false,
            collectiviteId,
          };

    let type;
    const programmes: any[] = [];
    let prioritaire = false;
    let categoriesUtilisateur = undefined;
    let valeurs = undefined;
    let services = undefined;
    let pilotes = undefined;
    let fiches = undefined;
    let fiches_non_classees = undefined;

    // Transforme les informations complémentaires aux indicateurs
    if (complet) {
      valeurs =
        item.valeurs?.filter(
          (val: any) => val.source === null || val.source.length === 0
        ) || [];
      valeurs = dateEnAnnee(valeurs, true);
      services = item.services ? item.services : [];
      pilotes = item.pilotes.map((p: any) => {
        return {
          tagId: undefined,
          userId: undefined,
          nom: p.tag_id ? p.tag.nom : p.user.prenom + ' ' + p.user.nom,
          idTablePassage: p.id,
          collectiviteId: p.collectivite_id,
        };
      });
      fiches = item.fiches;
      fiches_non_classees = fiches.filter(
        (fiche: any) => fiche.plans === null || fiche.plans.length === 0
      );
    }

    // Découpe les catégories en type, programme et catégories utilisateur
    item.categories.forEach((cat: any) => {
      if (cat.collectivite_id !== null) {
        if (complet && cat.collectivite_id === collectiviteId) {
          categoriesUtilisateur = [];
          categoriesUtilisateur.push({
            id: cat.id,
            nom: cat.nom,
            collectivite_id: cat.collectivite_id,
          });
        }
      } else if (cat.groupement_id !== null) {
        const groupe = groupement.filter(
          (g: any) => g.id === cat.groupement_id
        );
        if (
          groupe.length > 0 &&
          groupe[0].collectivites &&
          groupe[0].collectivites.includes(collectiviteId)
        ) {
          programmes.push({ id: cat.id, nom: cat.nom });
        }
      } else if (cat.nom === 'resultat' || cat.nom === 'impact') {
        type = cat;
      } else if (cat.nom === 'prioritaire') {
        prioritaire = true;
      } else {
        programmes.push({ id: cat.id, nom: cat.nom });
      }
    });

    return {
      ...item,
      rempli: item.valeurs?.length > 0 || 0, // Ajouter le champ 'rempli'
      commentaire: plusInfo.commentaire, // Remonte le champ 'commentaire'
      confidentiel: plusInfo.confidentiel, // Remonte le champ 'confidentiel'
      plus: undefined, // Supprimer le champ 'plus'
      categories: undefined, // Supprimer le champ 'categories'
      valeurs: valeurs,
      categories_utilisateur: categoriesUtilisateur, // Divise le champ 'categorie' en 'categories_utilisateur'
      type: type, // Divise le champ 'categorie' en 'type'
      programmes: programmes, // Divise le champ 'categorie' en 'programmes'
      prioritaire: prioritaire, // Divise le champ 'categorie' en 'prioritaire'
      est_perso: item.collectivite_id !== null,
      pilotes,
      services,
      fiches,
      fiches_non_classees, // Ajoute le champ 'est_perso'
      enfants: item?.enfants
        ?.filter(
          (e: any) =>
            !e.groupement_id ||
            groupement
              .filter((g: any) => g.id === e.groupement_id)[0]
              .collectivites?.includes(collectiviteId)
        )
        .map((e: any) => e.id),
      parents: item?.parents?.map((p: any) => p.id),
      has_open_data: item.valeurs.some((v: any) => !!v.source),
    };
  });
}
