import { TMemoire } from "./fetchData.ts";
import { TAnnexeImport, TFicheResume, TIndicateur, TPersonne, TTag } from "./types.ts";
import { Enums } from "../_shared/typeUtils.ts";
import { Database } from "../_shared/database.types.ts";
/**
 * Nettoie du texte
 * @param texte
 * @param titre vrai si le texte est un titre et ne doit pas contenir de saut de ligne
 * @return texte nettoyé
 */
export declare const texte: (texte: string, titre: boolean) => Promise<string>;
/**
 * Nettoie un entier
 * @param entier
 * @return entier nettoyé
 */
export declare const entier: (entier: string) => Promise<number>;
/**
 * Nettoie un booléen
 * @param booleen
 * @return booléen nettoyé
 */
export declare const booleen: (booleen: any) => Promise<boolean>;
/**
 * Nettoie une date
 * @param date
 * @return date nettoyée
 */
export declare const date: (date: any) => Promise<string>;
/**
 * Nettoie des thématiques
 * @param thematique
 * @param memoire données utiles au nettoyage du fichier
 * @return thematique nettoyée
 */
export declare const thematique: (thematique: string, memoire: TMemoire) => Promise<Database["public"]["Tables"]["thematique"]["Insert"]>;
/**
 * Nettoie des sous-thématiques
 * @param sousThematique
 * @param memoire données utiles au nettoyage du fichier
 * @return sous-thematique nettoyée
 */
export declare const sousThematique: (sousThematique: string, memoire: TMemoire) => Promise<Database["public"]["Tables"]["sous_thematique"]["Insert"]>;
/**
 * Nettoie des indicateurs
 * @param indicateurs chaîne de caractère contenant N indicateurs
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau d'indicateurs nettoyés
 */
export declare const indicateurs: (indicateurs: any, memoire: TMemoire) => Promise<TIndicateur[]>;
/**
 * Nettoie des résultats
 * @param resultats chaîne de caractère contenant N résultats
 * @return tableau de résultats nettoyés
 */
export declare const resultats: (resultats: string) => Promise<Enums<"fiche_action_resultats_attendus">[]>;
/**
 * Nettoie des cibles
 * @param cibles chaîne de caractère contenant N cibles
 * @return tableau de cibles nettoyées
 */
export declare const cibles: (cibles: string) => Promise<Enums<"fiche_action_cibles">[]>;
/**
 * Nettoie des actions
 * @param actions chaîne de caractère contenant N actions
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau d'actions nettoyées
 */
export declare const actions: (actions: any, memoire: TMemoire) => Promise<Database["public"]["Tables"]["action_relation"]["Insert"][]>;
/**
 * Nettoie des tags
 * @param tags chaîne de caractère contenant N tags
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau de tags nettoyés
 */
export declare const tags: (tags: string, memoire: TMemoire) => Promise<TTag[]>;
/**
 * Nettoie des personnes
 * @param personnes chaîne de caractère contenant N indicateurs
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau de personnes nettoyées
 */
export declare const personnes: (personnes: string, memoire: TMemoire) => Promise<TPersonne[]>;
/**
 * Nettoie un statut
 * @param statut
 * @return statut nettoyé
 */
export declare const statut: (statut: any) => Promise<Enums<"fiche_action_statuts">>;
/**
 * Nettoie un niveau de priorité
 * @param niveau
 * @return niveau nettoyé
 */
export declare const niveauPriorite: (niveau: any) => Promise<Enums<"fiche_action_niveaux_priorite">>;
/**
 * Nettoie des fiches liées
 * @param fiches chaîne de caractère contenant N fiches
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau de fiches liées nettoyées
 */
export declare const fiches: (fiches: any, memoire: TMemoire) => Promise<TFicheResume[]>;
/**
 * Nettoie des annexes format lien
 * @param annexes chaîne de caractère contenant N annexes
 * @return tableau d'annexes format lien nettoyées
 */
export declare const annexes: (annexes: string) => Promise<TAnnexeImport[]>;
//# sourceMappingURL=fonctionsDeNettoyage.d.ts.map