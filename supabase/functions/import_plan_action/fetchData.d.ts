import { TFicheResume, TIndicateur, TPersonneMemoire } from "./types.ts";
import { Database } from "../_shared/database.types.ts";
/**
 * Récupère des données utiles au nettoyage du fichier excel
 * @param supabaseClient client supabase
 * @param collectivite_id identifiant de la collectivité
 * @return des données utiles au nettoyage du fichier excel
 */
export declare const fetchData: (supabaseClient: any, collectivite_id: number) => Promise<{
    collectivite_id: number;
    thematiques: Map<string, {
        id?: number;
        md_id?: "indicateur_thematique" | "eci_dechets" | "energie_et_climat" | "agri_alim" | "urbanisme_et_amenagement" | "mobilite_et_transport" | "nature_environnement_air" | "eau_assainissement" | "strategie_orga_interne" | "activites_economiques" | "solidarite_lien_social";
        nom: string;
    }>;
    sousThematiques: Map<string, {
        id?: number;
        sous_thematique: string;
        thematique_id: number;
    }>;
    indicateurs: Map<string, TIndicateur>;
    actions: Map<string, {
        id: string;
        parent?: string;
        referentiel: "eci" | "cae";
    }>;
    personnes: Map<string, TPersonneMemoire>;
    fiches: Map<string, TFicheResume>;
}>;
export type TMemoire = Awaited<ReturnType<typeof fetchData>>;
/**
 * Récupère les thématiques
 * @param supabaseClient client supabase
 * @return map <nom de la thématique, objet de la thématique>
 */
export declare const fetchThematiques: (supabaseClient: any) => Promise<Map<string, Database["public"]["Tables"]["thematique"]["Insert"]>>;
/**
 * Récupère les sous-thématiques
 * @param supabaseClient client supabase
 * @return map <nom de la sous-thématique, objet de la sous-thématique>
 */
export declare const fetchSousThematiques: (supabaseClient: any) => Promise<Map<string, Database["public"]["Tables"]["sous_thematique"]["Insert"]>>;
/**
 * Récupère les indicateurs de la collectivité
 * @param supabaseClient client supabase
 * @param collectivite_id identifiant de la collectivité
 * @return map <identifiant (référentiel) ou nom (personnalisé) de l'indicateur, objet de l'indicateur>
 */
export declare const fetchIndicateurs: (supabaseClient: any, collectivite_id: number) => Promise<Map<string, TIndicateur>>;
/**
 * Récupère les actions
 * @param supabaseClient client supabase
 * @return map <identifiant de l'action, objet de l'action>
 */
export declare const fetchActions: (supabaseClient: any) => Promise<Map<string, Database["public"]["Tables"]["action_relation"]["Insert"]>>;
/**
 * Récupère les personnes de la collectivité
 * @param supabaseClient client supabase
 * @param collectivite_id identifiant de la collectivité
 * @return map <nom de la personne, objet de la personne>
 */
export declare const fetchPersonnes: (supabaseClient: any, collectivite_id: number) => Promise<Map<string, TPersonneMemoire>>;
/**
 * Récupère les fiches de la collectivité
 * @param supabaseClient client supabase
 * @param collectivite_id identifiant de la collectivité
 * @return map <titre de la fiche, objet de la fiche>
 */
export declare const fetchFiches: (supabaseClient: any, collectivite_id: number) => Promise<Map<string, TFicheResume>>;
//# sourceMappingURL=fetchData.d.ts.map