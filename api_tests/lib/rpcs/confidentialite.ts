import * as retry from 'https://deno.land/x/retry@v2.0.0/mod.ts';
import { signIn, signOut } from '../auth.ts';
import { Database } from '../database.types.ts';
import { supabase } from '../supabase.ts';
import { testReset } from './testReset.ts';

/**
 * Identifiant des collectivités de test :
 * 500 - Collectivité A
 * 501 - Collectivité B en audit
 * 502 - Collectivité C en audit et en accès restreint
 **/
const collectiviteIDTest = [500, 501, 502]
const collectiviteIDTest = [500, 501, 502];

/** Les différents profils d'utilisateur à tester */
const allProfils: Database['public']['Enums']['confidentialite_profil'][] = [
  'public',
  'connecte',
  'verifie',
  'support',
  'lecture',
  'edition',
  'admin',
  'auditeur',
];

/** Les profils d'utilisateurs rattachés à une collectivité */
const profilAvecCollectivite: Database['public']['Enums']['confidentialite_profil'][] =
  ['lecture', 'edition', 'admin', 'auditeur'];

/** Les différentes actions possibles (c_reate, r_ead, u_pdate, d_elete) */
type crud = 'c' | 'r' | 'u' | 'd';

/** Les paramètres et la clause where à passer en appelant la base de données */
type parameters = {
  parameter: { [key: string]: any } | null;
  where: { nom: string; valeur: any | null } | null;
  relation: string | null;
};

/** Fonctions qui ont une action de suppression ou d'insertion nécessitant de régénérer les données après leur appel */
const fonctionsDeSuppression = [
  'delete_axe_all',
  'enlever_fiche_action_d_un_axe',
  'claim_collectivite',
  'ajouter_fiche_action_dans_un_axe',
  'add_bibliotheque_fichier',
  'deplacer_fiche_action_dans_un_axe',
];

/** Fonctions d'insertion nécessitant des paramètres propre à l'insertion */
const fonctionDeInsert = [
  'ajouter_fiche_action_dans_un_axe',
  'add_bibliotheque_fichier',
  'create_fiche',
];

/** Tables avec des droits pour l'utilisateur lui-même (auth = user_id) */
const tablesDroitSurSoi = ['action_discussion_commentaire'];

/** Colonnes possibles dans une clause where ordonnées par pertinence  */
const colonnesWhere = [
  'collectivite_id',
  'discussion_id',
  'fiche_id',
  'fiche_une',
  'action_id',
  'indicateur_id',
  'preuve_id',
  'question_id',
  'axe_id',
  'financeur_tag_id',
  'service_tag_id',
  'partenaire_tag_id',
  'structure_tag_id',
  'audit_id',
  'id',
  'referentiel',
  'modified_at',
  'user_id',
];

/** Elements dont certain accès ne sont autorisé qu'en audit */
const queEnAudit = ['action_audit_state', 'audit_en_cours'];

/** Tables preuves nécessitant de spécifier l'url qui n'apparaît pas comme un champ obligatoire mais en est un*/
const tablesPreuve = [
  'annexe',
  'preuve_audit',
  'preuve_complementaire',
  'preuve_rapport',
  'preuve_reglementaire',
  'preuve_labellisation',
];

/** Tables tags nécessitant une clause where sur l'id et non sur la collectivité pour éviter les conflits */
const tablesTag = [
  'financeur_tag',
  'personne_tag',
  'service_tag',
  'partenaire_tag',
  'structure_tag',
];

/** Elements nécessitant d'attendre le calcul du business */
const waitBusiness = ['personnalisation_consequence'];

/** Temps d'attente pour le calcul du business en ms */
const waitBusinessTimeout = 20000;

/** Tables avec une contrainte unique sur plusieurs attributs et nécessite un reset pour éviter les conflits*/
const tablesMultipleContrainteUnique = [
  'indicateur_objectif_commentaire',
  'indicateur_perso_objectif_commentaire',
  'indicateur_perso_resultat_commentaire',
  'indicateur_pilote',
  'indicateur_service_tag',
  'indicateur_confidentiel',
];

/** Vues dont on ne récupère pas les colonnes (ex: les vues materialisees) */
const vuesSansColonnes = ['site_labellisation'];

/** Tables dont on ne récupère pas les colonnes car toutes les colonnes peuvent être nullables */
const tablesSansColonnes = [
  'indicateur_pilote',
  'indicateur_service_tag',
  'indicateur_confidentiel',
];

/**
 * Fonction à appeler pour lancer les tests
 *
 * @param typeElement type de l'élément à tester (null pour lancer tous les tests)
 * @param nomElement nom de l'élément à tester (null pour lancer tous les tests d'un type)
 * @param profil profil utilisateur à tester sur l'élément (null pour lancer les tests pour tous les profils)
 */
export async function runConfidentialiteTest(
  typeElement:
    | Database['public']['Enums']['confidentialite_type_element']
    | null,
  nomElement: string | null
): Promise<boolean> {
  await testReset();
  await supabase.rpc('confidentialite_init_test');
  let toReturn = true;

  // Lancer tous les tests
  if (typeElement == null) {
    toReturn = await confidentialiteTest();
  } else {
    // Lancer tous les tests pour ce type d'élément
    if (nomElement == null) {
      toReturn = await confidentialiteTestTypeElement(typeElement);
    } else {
      // Lancer tous les tests pour cet élément
      toReturn = await confidentialiteTestElement(
        typeElement,
        nomElement,
        null
      );
    }
  }
  await testReset();
  return toReturn;
}

/**
 * Connecte un utilisateur des tests crud
 *
 * @param profil profil de l'utilisateur à connecter
 * @param collectivite l'id de la collectivité auquel appartient le profil à connecter
 */
async function confidentialiteSignIn(
  profil: Database['public']['Enums']['confidentialite_profil'],
  collectivite: number
) {
  if (profil == 'public' || (profil == 'auditeur' && collectivite == 500)) {
    // La collectivité 500 n'est pas en audit et donc n'a pas d'auditeur
    return null;
  }
  return await supabase.auth.signInWithPassword({
    email:
      'prenom@' +
      (collectivite == 0 ? profil : profil + '_' + collectivite) +
      '.com',
    password: 'yolododo',
  });
}

/**
 * Lance tous les tests
 *
 * @return vrai si les tests sont passés
 */
async function confidentialiteTest(): Promise<boolean> {
  let toReturn = true;
  // Tables
  toReturn = (await confidentialiteTestTypeElement('table')) && toReturn;
  // Fonctions
  toReturn = (await confidentialiteTestTypeElement('fonction')) && toReturn;
  // Vues
  toReturn = (await confidentialiteTestTypeElement('vue')) && toReturn;
  return toReturn;
}

/**
 * Lance les tests pour un type d'élément
 *
 * @param typeElement table, fonction ou vue à tester
 * @return vrai si les tests sont passés
 */
async function confidentialiteTestTypeElement(
  typeElement: Database['public']['Enums']['confidentialite_type_element']
): Promise<boolean> {
  let toReturn = true;
  const elements = await supabase
    .from('confidentialite_' + typeElement + 's_a_tester')
    .select('element, id_element');
  if (elements != null && elements.data != null) {
    for (const element of elements.data) {
      toReturn =
        (await confidentialiteTestElement(
          typeElement,
          element.element,
          element.id_element
        )) && toReturn;
    }
  }
  return toReturn;
}

/**
 * Lance les tests d'un élément.
 *
 * Permet de relancer la fonction `_confidentialiteTestElement` en cas d'échec
 */
const confidentialiteTestElement = retry.retryAsyncDecorator(
  _confidentialiteTestElement,
  {
    delay: 200,
    maxTry: 5,
  }
);

/**
 * Lance les tests d'un élément
 *
 * @param typeElement table, fonction ou vue à tester
 * @param nomElement nom de l'élément à tester
 * @param idElement id de l'élément à tester (null hors fonction)
 * @return vrai si les tests de cet élément sont passés
 */
async function _confidentialiteTestElement(
  typeElement: Database['public']['Enums']['confidentialite_type_element'],
  nomElement: string,
  idElement: string | null
): Promise<boolean> {
  if (waitBusiness.includes(nomElement)) {
    // Attend les calculs du business
    await new Promise((f) => setTimeout(f, waitBusinessTimeout));
  }
  let toReturn = true;
  if (typeElement == 'fonction' && idElement == null) {
    const elements = await supabase
      .from('confidentialite_fonctions_a_tester')
      .select('element, id_element')
      .eq('element', nomElement);
    if (elements != null && elements.data != null) {
      for (const element of elements.data) {
        for (const profil of allProfils) {
          toReturn =
            (await confidentialiteTestProfil(
              typeElement,
              nomElement,
              element.id_element as string,
              profil
            )) && toReturn;
        }
      }
    }
  } else {
    for (const profil of allProfils) {
      toReturn =
        (await confidentialiteTestProfil(
          typeElement,
          nomElement,
          idElement,
          profil
        )) && toReturn;
    }
  }

  return toReturn;
}

/**
 * Lance les tests d'un élément pour un certain profil
 *
 * @param typeElement table, fonction ou vue à tester
 * @param nomElement nom de l'élément à tester
 * @param idElement id de l'élément à tester (null hors fonction)
 * @param profil type de profil à tester
 * @return vrai si les tests pour ce profil sont passés
 */
async function confidentialiteTestProfil(
  typeElement: Database['public']['Enums']['confidentialite_type_element'],
  nomElement: string,
  idElement: string | null,
  profil: Database['public']['Enums']['confidentialite_profil']
): Promise<boolean> {
  let toReturn = true;
  let cVue = false;
  let uVue = false;
  let dVue = false;
  if (typeElement == 'vue') {
    // Vérifie s'il existe des triggers permettant d'insert, update ou delete sur la vue,
    // Ou si ce sont des vues simples dont postgre permet l'insertion
    const vue = await supabase
      .from('confidentialite_vues_a_tester')
      .select()
      .eq('element', nomElement);
    if (vue != null && vue.data != null) {
      cVue = vue.data[0].c as unknown as boolean;
      uVue = vue.data[0].u as unknown as boolean;
      dVue = vue.data[0].d as unknown as boolean;
    }
  }
  const collectivites = profilAvecCollectivite.includes(profil)
    ? collectiviteIDTest
    : [0];
  // Boucle sur les utilisateurs 'profil' de chaque collectivité (ex:  admin_500)
  for (let profilCol of collectivites) {
    if (profil == 'auditeur' && profilCol == 500) {
      // La collectivité 500 n'est pas en audit et donc n'a pas d'auditeur
      continue;
    }
    // Boucle sur chaque collectivité à tester
    for (let collectivite of collectiviteIDTest) {
      // Test C
      if (typeElement == 'table' || cVue) {
        toReturn =
          (await confidentialiteTestCRUD(
            typeElement,
            nomElement,
            idElement,
            profil,
            profilCol,
            'c',
            collectivite
          )) && toReturn;
      }

      // Test R
      toReturn =
        (await confidentialiteTestCRUD(
          typeElement,
          nomElement,
          idElement,
          profil,
          profilCol,
          'r',
          collectivite
        )) && toReturn;
      // Test U
      if (typeElement == 'table' || uVue) {
        toReturn =
          (await confidentialiteTestCRUD(
            typeElement,
            nomElement,
            idElement,
            profil,
            profilCol,
            'u',
            collectivite
          )) && toReturn;
      }
      // Test D
      if (typeElement == 'table' || dVue) {
        toReturn =
          (await confidentialiteTestCRUD(
            typeElement,
            nomElement,
            idElement,
            profil,
            profilCol,
            'd',
            collectivite
          )) && toReturn;
      }
    }
  }
  return toReturn;
}

/**
 * Lance les tests CRUD pour un certain profil sur une collectivité
 *
 * @param typeElement table, fonction ou vue à tester
 * @param nomElement nom de l'élément à tester
 * @param idElement id de l'élément à tester (null hors fonction)
 * @param profil type de profil à tester
 * @param profilCol collectivité auquel appartient le profil
 * @param crud commande crud à tester
 * @param collectivite collectivité sur laquelle est effectué le test
 * @return vrai si les tests de création sont passés
 */
async function confidentialiteTestCRUD(
  typeElement: Database['public']['Enums']['confidentialite_type_element'],
  nomElement: string,
  idElement: string | null,
  profil: Database['public']['Enums']['confidentialite_profil'],
  profilCol: number,
  crud: crud,
  collectivite: number
): Promise<boolean> {
  // Variables
  let resultat;
  // Récupère les objets pour create, update, les paramètres d'une fonction, et les clauses where
  const parametres: parameters = await confidentialiteParametre(
    typeElement,
    nomElement,
    idElement,
    collectivite,
    crud == 'c' || fonctionDeInsert.includes(nomElement)
  );
  let parametreRelation: parameters | null = null;
  if (typeElement == 'fonction' && parametres.relation != null) {
    const vue = await supabase
      .from('confidentialite_vues_a_tester')
      .select()
      .eq('element', parametres.relation);
    let typeRelation: Database['public']['Enums']['confidentialite_type_element'] =
      'table';
    if (vue != null && vue.data != null && vue.data.length > 0) {
      typeRelation = 'vue';
    }
    parametreRelation = await confidentialiteParametre(
      typeRelation,
      parametres.relation as string,
      null,
      collectivite,
      false
    );
  }
  // Fait le test
  await confidentialiteSignIn(profil, profilCol);
  switch (crud) {
    case 'c':
      resultat = await supabase
        .from(nomElement)
        .insert(parametres.parameter)
        .select();
      break;
    case 'r':
      if (typeElement == 'fonction') {
        if (parametres.relation == null) {
          resultat = await supabase
            .rpc(nomElement as any, parametres.parameter)
            .select();
        } else if (
          parametreRelation != null &&
          parametreRelation.where != null
        ) {
          // Cas special, doit prendre un indicateur avec des enfants
          if (
            nomElement == 'enfants' &&
            parametreRelation.where.valeur == 'eci_5'
          ) {
            parametreRelation.where.valeur = 'cae_2.a';
          }
          resultat = await supabase
            .from(parametres.relation)
            .select('*, ' + nomElement)
            .eq(parametreRelation.where.nom, parametreRelation.where.valeur);
        }
      } else if (parametres.where != null) {
        resultat = await supabase
          .from(nomElement)
          .select()
          .eq(parametres.where.nom, parametres.where.valeur);
      } else {
        resultat = await supabase.from(nomElement).select();
      }
      break;
    case 'u':
      if (parametres.where != null) {
        resultat = await supabase
          .from(nomElement)
          .update(parametres.parameter)
          .eq(parametres.where.nom, parametres.where.valeur)
          .select();
      } else {
        // Rentre dans ce cas que pour les tables abstraites, json, maintenance, thematique, usage et visite.
        // Ne marche pas, car il faut forcément un where pour l'update
        // N'a pas d'impact sur le résultat
        resultat = await supabase
          .from(nomElement)
          .update(parametres.parameter)
          .select();
      }
      break;
    case 'd':
      if (parametres.where != null) {
        resultat = await supabase
          .from(nomElement)
          .delete()
          .eq(parametres.where.nom, parametres.where.valeur)
          .select();
      } else {
        // Rentre dans ce cas que pour les tables abstraites json et maintenance, thematique, usage et visite.
        // Ne marche pas, car il faut forcément un where pour le delete
        // N'a pas d'impact sur le résultat
        resultat = await supabase.from(nomElement).delete().select();
      }
      break;
  }
  await signOut();

  if (resultat) {
    // Reset les données s'il y a eu une suppression
    let deleted =
      crud == 'd' && resultat.data != null && resultat.data.length > 0;
    let deletedFonction =
      typeElement == 'fonction' && fonctionsDeSuppression.includes(nomElement);
    // Reset les données qui ont un nombre d'insert limité (ex: les tables avec des clés composées)
    let futurConflict = false;
    if (
      (crud == 'c' || crud == 'u') &&
      resultat.data != null &&
      resultat.data.length > 0
    ) {
      const possibleConflict = await supabase
        .from('confidentialite_cle_primaire_compose')
        .select()
        .eq('table_name', nomElement);
      futurConflict =
        (possibleConflict.data != null && possibleConflict.data.length > 0) ||
        nomElement.includes('_tag') ||
        tablesDroitSurSoi.includes(nomElement) ||
        tablesMultipleContrainteUnique.includes(nomElement);
    }
    if (deleted || deletedFonction || futurConflict) {
      await testReset();
      await supabase.rpc('confidentialite_init_test');
      if (waitBusiness.includes(nomElement)) {
        // Attend les calculs du business
        await new Promise((f) => setTimeout(f, waitBusinessTimeout));
      }
    }
  }
  // Vérifie le résultat du test
  return await confidentialiteCheckResultat(
    typeElement,
    nomElement,
    profil,
    profilCol,
    crud,
    collectivite,
    resultat,
    parametres.relation
  );
}

/**
 * Permet de créer dynamiquement les objets pour create, update, les paramètres d'une fonction, et les clauses where
 *
 * @param typeElement table, fonction ou vue à tester
 * @param nomElement nom de l'élément à tester
 * @param idElement id de l'élément à tester (null hors fonction)
 * @param collectivite collectivité sur laquelle est effectué le test
 * @param insert vrai si c'est une action d'insert qui est testé
 * @return parameters avec l'objet à upsert et/ou la condition where à appliquer
 */
async function confidentialiteParametre(
  typeElement: Database['public']['Enums']['confidentialite_type_element'],
  nomElement: string,
  idElement: string | null,
  collectivite: number,
  insert: boolean
): Promise<parameters> {
  let nomVue;
  // Récupère les paramètres
  switch (typeElement) {
    case 'table':
      nomVue = 'confidentialite_tables_colonnes';
      break;
    case 'fonction':
      nomVue = 'confidentialite_fonctions_parametres';
      break;
    case 'vue':
      nomVue = 'confidentialite_vues_colonnes';
      break;
  }
  const params = await supabase
    .from(nomVue)
    .select()
    .eq('element', typeElement == 'fonction' ? idElement : nomElement);
  // Crée dynamiquement l'objet à insérer, à modifier, ou les paramètres d'une fonction
  const toInsert: { [key: string]: any } = {};
  let relation: string | null = null;
  let mapParams: Map<string, any> = new Map<string, string>();
  if (params != null && params.data != null) {
    if (tablesSansColonnes.includes(nomElement)) {
      params.data.push({ colonne: 'collectivite_id', type: 'integer' });
      params.data.push({ colonne: 'indicateur_id', type: 'indicateur_id' });

      if (nomElement == 'indicateur_pilote') {
        params.data.push({ colonne: 'tag_id', type: 'integer' });
      }
    }
    if (nomElement == 'collectivite') {
      params.data.push({ colonne: 'id', type: 'integer' });
    }
    for (let param of params.data) {
      if (param.colonne == null) {
        relation = param.type;
      } else {
        mapParams.set(param.colonne, param.type);
        toInsert[param.colonne] = await confidentialiteParametreValeurParDefaut(
          nomElement,
          param.colonne,
          param.type,
          collectivite,
          insert
        );
      }
    }
    if (tablesPreuve.includes(nomElement)) {
      // Cas spécial :
      // les preuves nécessitent de spécifier l'url qui n'apparaît pas comme un champ obligatoire, mais en est un
      toInsert['url'] = 'url';
    }
  }
  // Crée dynamiquement une clause where pour cibler les collectivités à tester
  let where = null;
  if (tablesTag.includes(nomElement)) {
    // Cas spécial :
    // les tags nécessitent un where sur l'id et non sur la collectivité pour éviter des conflits à l'update
    where = {
      nom: 'id',
      valeur: await confidentialiteParametreValeurParDefaut(
        nomElement,
        'id',
        'integer',
        collectivite,
        false
      ),
    };
  } else if (vuesSansColonnes.includes(nomElement)) {
    where = {
      nom: 'collectivite_id',
      valeur: collectivite,
    };
  } else {
    for (let colonneWhere of colonnesWhere) {
      if (mapParams.get(colonneWhere) != null) {
        where = {
          nom: colonneWhere,
          valeur: await confidentialiteParametreValeurParDefaut(
            nomElement,
            colonneWhere,
            mapParams.get(colonneWhere),
            collectivite,
            false
          ),
        };
        break;
      }
    }
  }

  return {
    parameter: toInsert,
    where: where,
    relation: relation,
  };
}

/**
 * Valeur par default pour les paramètres
 *
 * @param nomElement nom de l'élément à tester
 * @param colonne colonne auquel il faut donner une valeur
 * @param type type de la colonne (ex: integer)
 * @param collectivite collectivité sur laquelle est effectué le test
 * @param insert vrai si c'est une action d'insert qui est testé
 * @return la valeur par default pour la colonne demandée
 */
async function confidentialiteParametreValeurParDefaut(
  nomElement: string,
  colonne: string,
  type: string,
  collectivite: number,
  insert: boolean
): Promise<any> {
  const col = collectivite == 0 ? 500 : collectivite;

  // Si colonne d'id, Retourne valeur selon le nom de la colonne
  switch (colonne) {
    case 'collectivite_id':
    case 'discussion_id':
    case 'old_axe_id':
      if (nomElement == 'fiche_action_import_csv') {
        // La colonne collectivite_id de fiche_action_import_csv est de type text
        return '' + col;
      }
      return col;
    case 'new_axe_id':
      return col * 10;
    case 'axe_id':
    case 'plan_id':
    case 'financeur_tag_id':
    case 'service_tag_id':
    case 'partenaire_tag_id':
    case 'structure_tag_id':
      return insert ? col * 10 : col;
    case 'fiche_id':
      if (nomElement == 'fiches_liees_par_fiche') {
        // fiche_une
        return col * 10 + 1;
      }
      return insert ? col * 10 : col;
    case 'action_id':
      switch (nomElement) {
        case 'labellisation_action_critere':
          return 'eci_1.1.2';
        case 'personnalisation':
        case 'personnalisation_regle':
          return 'eci_2.1';
        case 'question_action':
          return 'eci_2.2';
        case 'indicateur_action':
          return insert ? 'eci_1.1.1.2' : 'eci_2.1';
      }
      return insert ? 'eci_1.1.1.2' : 'eci_1.1.1.1';
    case 'referentiel':
      return 'eci';
    case 'indicateur_id':
    case 'indicateur_referentiel_id':
    case 'indicateur_personnalise_id':
      if (type == 'integer') {
        return insert ? col * 10 : col;
      }
      if (nomElement == 'indicateur_confidentiel') {
        // L'indicateur eci_5 n'est pas mis en confidentiel pour ne pas bloquer les autres tests
        return insert ? 'eci_6' : 'eci_7';
      }
      return insert ? 'eci_6' : 'eci_5';
    case 'preuve_id':
      if (nomElement == 'preuve_reglementaire') {
        return insert ? 'PDA' : 'CEP';
      }
      return insert ? 'test' : 'CEP';
    case 'question_id':
      switch (nomElement) {
        case 'reponse_binaire':
        case 'justification':
        case 'question_action':
          return insert ? 'dechets_2' : 'dechets_1';
        case 'reponse_choix':
          return insert ? 'voirie_1' : 'EP_1';
        case 'reponse_proportion':
          return insert ? 'tourisme_1' : 'habitat_2';
      }
      return 'foret';
    case 'choix_id':
      return insert ? 'voirie_1_a' : 'EP_1_b';
    case 'fiche_une':
      return insert ? col * 10 + 3 : col * 10 + 1;
    case 'fiche_deux':
      return insert ? col * 10 + 4 : col * 10 + 2;
    case 'thematique':
      return 'Énergie et climat';
    case 'audit_id':
    case 'demande_id':
      // La demande a un id généré automatiquement contrairement aux autres tables,
      // il faut donc aller le chercher
      await signIn('yolododo');
      const aud = await supabase
        .from('audit')
        .select()
        .eq('collectivite_id', col);
      await signOut();
      if (aud.data != null) {
        return colonne == 'audit_id'
          ? aud.data[0]['id']
          : aud.data[0]['demande_id'];
      }
      return null;
    case 'membre_id':
      return '83110e7a-44be-4d8a-a5ab-37cf46989d9e';
    case 'id':
      switch (nomElement) {
        case 'sous_thematique':
          return 44;
        case 'action_children':
        case 'action_definition_summary':
        case 'action_title':
          return 'eci_1.1';
        case 'question_thematique_display':
          return 'foret';
        case 'indicateur_definition':
          return 'eci_5';
        case 'preuve_reglementaire_definition':
          return 'TVB';
        case 'claim_collectivite':
          return col * 10;
        case 'indicateur_source':
          return 'citepa';
        case 'collectivite':
        case 'collectivite_test':
        case 'commune':
        case 'epci':
        case 'indicateur_parent':
          // N'a pas de type
          return col;
      }
  }
  // Sinon, retourne valeur selon le type
  switch (type) {
    case 'integer':
      if (colonne == 'id') {
        return col;
      }
      return 1;
    case 'action_id':
      return insert ? 'eci_1.1' : 'eci_2.1';
    case 'double precision':
      return 1.0;
    case 'text':
      if (tablesTag.includes(nomElement) && colonne == 'nom') {
        let tagNom = nomElement;
        tagNom = tagNom.replace('_tag', '');
        return insert ? 'tag' : tagNom;
      }
      return '';
    case 'character varying':
      if (colonne == 'id') {
        switch (nomElement) {
          case 'indicateur_definition':
            return insert ? 'eci_5' : 'eci_4';
          case 'action_relation':
            return insert ? 'eci_1.1' : 'eci_2.1';
          case 'question':
            return insert ? 'scolaire_3' : 'scolaire_1';
          case 'question_choix':
            return insert ? 'EP_1_d' : 'EP_1_a';
          case 'question_thematique':
            return insert ? 'test' : 'mobilite';
          case 'filtre_intervalle':
            return '100';
        }
      } else if (colonne == 'hash') {
        return "'e9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b8'";
      }
      return '';
    case 'timestamp with time zone':
    case 'timestamp without time zone':
      return '5000-06-09 00:25:34.267751 +00:00';
    case 'json':
    case 'jsonb':
      if (nomElement == 'save_reponse') {
        return {
          question_id: 'dechets_2',
          collectivite_id: col,
          reponse: true,
        };
      }
      return {};
    case 'uuid':
      if (colonne == 'user_id') {
        return '17440546-f389-4d4f-bfdb-b0c94a1bd0f9';
      }
      return 'd54266fb-2891-4800-b7f0-68fac1b9a6c1';
    case 'boolean':
      return false;
    case 'numrange':
      return '[0,20000]';
    case 'ARRAY':
      return [];
    case 'avancement':
      return 'fait';
    case 'etoile':
      return null;
    case 'fiche_action_action':
      return {
        fiche_id: col,
        action_id: 'eci_2.1',
      };
    case 'fiche_action_indicateur':
      return {
        fiche_id: col,
        indicateur_id: 'eci_5',
      };
    case 'site_labellisation':
      return {
        collectivite_id: col,
        nom: null,
        type_collectivite: null,
        nature_collectivite: null,
        code_siren_insee: null,
        region_name: null,
        region_code: null,
        departement_name: null,
        departement_code: null,
        population_totale: null,
        active: true,
        cot: false,
        engagee: false,
        labellisee: false,
        cae_obtenue_le: null,
        cae_etoiles: null,
        cae_score_realise: null,
        cae_score_programme: null,
        eci_obtenue_le: null,
        eci_etoiles: null,
        eci_score_realise: null,
        eci_score_programme: null,
      };
    case 'site_region':
      return {
        insee: '76',
        labellisation: null,
      };
  }
  // Si type non trouvé, alors c'est un type propre à TeT
  const enumType = await supabase
    .from('confidentialite_types_enum')
    .select('enum_nom')
    .eq('type_nom', type);
  return enumType.data == null || enumType.data[0] == null
    ? ''
    : enumType.data[0].enum_nom;
}

/**
 * Compare le résultat du test avec le résultat attendu selon la matrice des droits
 *
 * @param typeElement table, fonction ou vue à tester
 * @param nomElement nom de l'élément à tester
 * @param profil type de profil à tester
 * @param profilCol collectivité auquel appartient le profil
 * @param crud commande crud à tester
 * @param collectivite collectivité sur laquelle est effectué le test
 * @param resultat résultat du test
 * @param relation nom de l'entrée d'une fonction relation
 * @return true si le profil peut faire cette action
 */
async function confidentialiteCheckResultat(
  typeElement: Database['public']['Enums']['confidentialite_type_element'],
  nomElement: string,
  profil: Database['public']['Enums']['confidentialite_profil'],
  profilCol: number,
  crud: any,
  collectivite: number,
  resultat: any,
  relation: string | null
): Promise<boolean> {
  let raisonEchec;
  let resultatObtenu;
  // Si le profil testé appartient à une collectivité et fait le test sur une autre collectivité,
  // le résultat attendu est celui du profil 'verifie'
  const vraiProfil =
    profilCol == 0 || profilCol == collectivite ? profil : 'verifie';
  // Récupère le résultat sur la matrice des droits
  const resultatMatrice = await supabase
    .from('confidentialite_crud')
    .select(crud)
    .eq('type_element', typeElement)
    .eq('nom_element', nomElement)
    .eq('profil', vraiProfil);

  let resultatAttendu = true;
  if (
    resultatMatrice == null ||
    resultatMatrice.data == null ||
    resultatMatrice.data.length == 0
  ) {
    // L'élément testé n'est pas dans la matrice
    resultatObtenu = null;
    raisonEchec = 'Absent de la table confidentialite_crud';
  } else {
    // Récupère le résultat attendu : vrai pour autoriser et faux pour non autoriser
    switch (resultatMatrice.data[0][crud]) {
      case 'oui':
        resultatAttendu = true;
        break;
      case 'non':
        resultatAttendu = false;
        break;
      case 'restreint':
        // La collectivité de test 502 est en accès restreint
        resultatAttendu = collectivite != 502;
        break;
      case 'soi':
        resultatAttendu = false;
        switch (nomElement) {
          case 'mes_collectivites':
            resultatAttendu = collectivite == profilCol;
            break;
        }
        break;
    }
    if (queEnAudit.includes(nomElement) && collectivite == 500) {
      // L'accès n'est autorisé qu'en audit
      resultatAttendu = false;
    }
    // Récupère le résultat obtenu
    if (resultat) {
      raisonEchec = `code ${resultat.status} : ${resultat.statusText}`;
      switch (resultat.status) {
        case 200:
          resultatObtenu = true;
          if (
            typeElement != 'fonction' &&
            (resultat.data == null || resultat.data.length == 0)
          ) {
            // Retour 200 pour une table ou une vue, mais avec un retour vide
            resultatObtenu = false;
            switch (crud) {
              case 'c':
                raisonEchec = "La création ne s'est pas faite";
                break;
              case 'r':
                raisonEchec = 'La requête retourne 0 enregistrement';
                // Cas spécial :
                // preuve_audit ne retourne pas de résultat pour la collectivité qui n'est pas en audit
                if (
                  nomElement == 'preuve_audit' &&
                  collectivite == 500 &&
                  profil != 'public' &&
                  profil != 'connecte'
                ) {
                  resultatObtenu = true;
                }
                break;
              case 'u':
              case 'd':
                raisonEchec =
                  "L'utilisateur n'a pas accès à cet enregistrement";
                break;
            }
          } else if (
            typeElement == 'fonction' &&
            resultat.data != null &&
            typeof resultat.data == 'object'
          ) {
            // Une fonction peut retourner des données null quand il n'y a pas les droits.
            // On considère donc que si tous les éléments retournés sont à null
            // alors l'utilisateur n'a pas les droits.
            resultatObtenu = false;
            for (let d in resultat.data) {
              if (resultat.data[d] != null) {
                resultatObtenu = true;
              }
            }
            // Cas spécial :
            // cherchable correspond à plusieurs fonctions
            // dont le point d'entrée ne possède pas les mêmes droits
            // (indicateur et indicateur personnalisé)
            if (
              nomElement == 'cherchable' &&
              relation == 'indicateur_personnalise_definition' &&
              ((collectivite == 502 && profil != 'public') ||
                profil == 'connecte')
            ) {
              resultatObtenu = true;
            }
          }
          break;
        case 201:
          resultatObtenu = true;
          break;
        case 204:
          resultatObtenu = typeElement == 'fonction';
          break;
        case 400:
          resultatObtenu = false;
          if (resultat.error != null) {
            raisonEchec = resultat.error.message;
          }
          // Cas spécial :
          // Les collectivités en audit ne peuvent pas commencer un audit
          if (
            nomElement == 'labellisation_commencer_audit' &&
            (collectivite == 501 || collectivite == 502) &&
            resultat.error.message ==
              "La demande liée à l'audit est en cours, elle n'a pas été envoyée."
          ) {
            resultatObtenu = true;
          }
          break;
        case 403:
          // Cas spécial :
          // Les profils testés sont déjà inscrit et n'ont pas d'invitation
          resultatObtenu = nomElement == 'consume_invitation';
          break;
        case 404:
        case 409:
          resultatObtenu = null;
          break;
        default: // 401, 405
          resultatObtenu = false;
      }
    } else {
      resultatObtenu = null;
      raisonEchec = 'Pas de résultats';
    }
  }
  // Retourne OK si le résultat attendu correspond au résultat obtenu
  const toReturn =
    resultatObtenu == null ? false : resultatObtenu == resultatAttendu;

  if (!toReturn) {
    console.log(
      typeElement +
        ' ' +
        nomElement +
        ' - ' +
        crud +
        ' par ' +
        profil +
        (profilCol == 0 ? ' ' : '_' + profilCol + ' ') +
        'sur la collectivité ' +
        collectivite +
        ' : ' +
        (resultatObtenu == null
          ? '%cERREUR%c'
          : (toReturn
              ? '%cOK %c[' + (resultatObtenu ? 'autorisé' : 'non autorisé')
              : '%cECHEC %c[' +
                (resultatObtenu ? 'autorisé à tort' : 'non autorisé à tort')) +
            ']') +
        ' (' +
        raisonEchec +
        ')',
      'color: ' +
        (resultatObtenu == null
          ? 'red'
          : (toReturn ? 'green' : 'orange') + ';'),
      'color : White;'
    );
  }
  return toReturn;
}
