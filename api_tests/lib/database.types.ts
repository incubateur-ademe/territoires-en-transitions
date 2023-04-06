export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  labellisation: {
    Tables: {
      action_audit_state: {
        Row: {
          action_id: string
          audit_id: number | null
          avis: string
          collectivite_id: number
          id: number
          modified_at: string
          modified_by: string
          ordre_du_jour: boolean
          statut: Database["public"]["Enums"]["audit_statut"]
        }
        Insert: {
          action_id: string
          audit_id?: number | null
          avis?: string
          collectivite_id: number
          id?: number
          modified_at?: string
          modified_by?: string
          ordre_du_jour?: boolean
          statut?: Database["public"]["Enums"]["audit_statut"]
        }
        Update: {
          action_id?: string
          audit_id?: number | null
          avis?: string
          collectivite_id?: number
          id?: number
          modified_at?: string
          modified_by?: string
          ordre_du_jour?: boolean
          statut?: Database["public"]["Enums"]["audit_statut"]
        }
      }
      audit: {
        Row: {
          collectivite_id: number
          date_debut: string | null
          date_fin: string | null
          demande_id: number | null
          id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          valide: boolean
        }
        Insert: {
          collectivite_id: number
          date_debut?: string | null
          date_fin?: string | null
          demande_id?: number | null
          id?: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          valide?: boolean
        }
        Update: {
          collectivite_id?: number
          date_debut?: string | null
          date_fin?: string | null
          demande_id?: number | null
          id?: number
          referentiel?: Database["public"]["Enums"]["referentiel"]
          valide?: boolean
        }
      }
      bibliotheque_fichier: {
        Row: {
          collectivite_id: number | null
          filename: string | null
          hash: string | null
          id: number
        }
        Insert: {
          collectivite_id?: number | null
          filename?: string | null
          hash?: string | null
          id?: number
        }
        Update: {
          collectivite_id?: number | null
          filename?: string | null
          hash?: string | null
          id?: number
        }
      }
      demande: {
        Row: {
          collectivite_id: number
          date: string
          en_cours: boolean
          envoyee_le: string | null
          etoiles: Database["labellisation"]["Enums"]["etoile"] | null
          id: number
          modified_at: string | null
          referentiel: Database["public"]["Enums"]["referentiel"]
          sujet: Database["labellisation"]["Enums"]["sujet_demande"]
        }
        Insert: {
          collectivite_id: number
          date?: string
          en_cours?: boolean
          envoyee_le?: string | null
          etoiles?: Database["labellisation"]["Enums"]["etoile"] | null
          id?: number
          modified_at?: string | null
          referentiel: Database["public"]["Enums"]["referentiel"]
          sujet?: Database["labellisation"]["Enums"]["sujet_demande"]
        }
        Update: {
          collectivite_id?: number
          date?: string
          en_cours?: boolean
          envoyee_le?: string | null
          etoiles?: Database["labellisation"]["Enums"]["etoile"] | null
          id?: number
          modified_at?: string | null
          referentiel?: Database["public"]["Enums"]["referentiel"]
          sujet?: Database["labellisation"]["Enums"]["sujet_demande"]
        }
      }
      etoile_meta: {
        Row: {
          etoile: Database["labellisation"]["Enums"]["etoile"]
          long_label: string
          min_realise_percentage: number
          min_realise_score: number | null
          prochaine_etoile: Database["labellisation"]["Enums"]["etoile"] | null
          short_label: string
        }
        Insert: {
          etoile: Database["labellisation"]["Enums"]["etoile"]
          long_label: string
          min_realise_percentage: number
          min_realise_score?: number | null
          prochaine_etoile?: Database["labellisation"]["Enums"]["etoile"] | null
          short_label: string
        }
        Update: {
          etoile?: Database["labellisation"]["Enums"]["etoile"]
          long_label?: string
          min_realise_percentage?: number
          min_realise_score?: number | null
          prochaine_etoile?: Database["labellisation"]["Enums"]["etoile"] | null
          short_label?: string
        }
      }
      preuve_base: {
        Row: {
          collectivite_id: number
          commentaire: string
          fichier_id: number | null
          lien: Json | null
          modified_at: string
          modified_by: string
          titre: string
          url: string | null
        }
        Insert: {
          collectivite_id: number
          commentaire?: string
          fichier_id?: number | null
          lien?: Json | null
          modified_at?: string
          modified_by?: string
          titre?: string
          url?: string | null
        }
        Update: {
          collectivite_id?: number
          commentaire?: string
          fichier_id?: number | null
          lien?: Json | null
          modified_at?: string
          modified_by?: string
          titre?: string
          url?: string | null
        }
      }
    }
    Views: {
      action_snippet: {
        Row: {
          action_id: string | null
          collectivite_id: number | null
          snippet: Json | null
        }
      }
      bibliotheque_fichier_snippet: {
        Row: {
          id: number | null
          snippet: Json | null
        }
      }
    }
    Functions: {
      active_audit: {
        Args: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
        }
        Returns: {
          collectivite_id: number
          date_debut: string | null
          date_fin: string | null
          demande_id: number | null
          id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          valide: boolean
        }
      }
      audit_evaluation_payload: {
        Args: {
          audit: unknown
        }
        Returns: Record<string, unknown>
      }
      critere_action: {
        Args: {
          collectivite_id: number
        }
        Returns: {
          referentiel: Database["public"]["Enums"]["referentiel"]
          etoiles: Database["labellisation"]["Enums"]["etoile"]
          action_id: unknown
          formulation: string
          score_realise: number
          min_score_realise: number
          score_programme: number
          min_score_programme: number
          atteint: boolean
          prio: number
        }[]
      }
      critere_fichier: {
        Args: {
          collectivite_id: number
        }
        Returns: {
          referentiel: Database["public"]["Enums"]["referentiel"]
          preuve_nombre: number
          atteint: boolean
        }[]
      }
      critere_score_global: {
        Args: {
          collectivite_id: number
        }
        Returns: {
          referentiel: Database["public"]["Enums"]["referentiel"]
          etoile_objectif: Database["labellisation"]["Enums"]["etoile"]
          score_a_realiser: number
          score_fait: number
          atteint: boolean
        }[]
      }
      current_audit: {
        Args: {
          col: number
          ref: Database["public"]["Enums"]["referentiel"]
        }
        Returns: {
          collectivite_id: number
          date_debut: string | null
          date_fin: string | null
          demande_id: number | null
          id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          valide: boolean
        }
      }
      etoiles: {
        Args: {
          collectivite_id: number
        }
        Returns: {
          referentiel: Database["public"]["Enums"]["referentiel"]
          etoile_labellise: Database["labellisation"]["Enums"]["etoile"]
          prochaine_etoile_labellisation: Database["labellisation"]["Enums"]["etoile"]
          etoile_score_possible: Database["labellisation"]["Enums"]["etoile"]
          etoile_objectif: Database["labellisation"]["Enums"]["etoile"]
        }[]
      }
      evaluate_audit_statuts: {
        Args: {
          audit_id: number
          scores_table: string
        }
        Returns: number
      }
      pre_audit_service_statuts: {
        Args: {
          audit_id: number
        }
        Returns: Json
      }
      referentiel_score: {
        Args: {
          collectivite_id: number
        }
        Returns: {
          referentiel: Database["public"]["Enums"]["referentiel"]
          score_fait: number
          score_programme: number
          completude: number
          complet: boolean
        }[]
      }
      upsert_preuves_reglementaire: {
        Args: {
          preuves: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      etoile: "1" | "2" | "3" | "4" | "5"
      sujet_demande: "labellisation" | "labellisation_cot" | "cot"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      abstract_any_indicateur_value: {
        Row: {
          annee: number
          modified_at: string
          valeur: number | null
        }
        Insert: {
          annee: number
          modified_at?: string
          valeur?: number | null
        }
        Update: {
          annee?: number
          modified_at?: string
          valeur?: number | null
        }
      }
      abstract_modified_at: {
        Row: {
          modified_at: string
        }
        Insert: {
          modified_at?: string
        }
        Update: {
          modified_at?: string
        }
      }
      action_commentaire: {
        Row: {
          action_id: string
          collectivite_id: number
          commentaire: string
          modified_at: string
          modified_by: string
        }
        Insert: {
          action_id: string
          collectivite_id: number
          commentaire: string
          modified_at?: string
          modified_by?: string
        }
        Update: {
          action_id?: string
          collectivite_id?: number
          commentaire?: string
          modified_at?: string
          modified_by?: string
        }
      }
      action_computed_points: {
        Row: {
          action_id: string
          modified_at: string
          value: number
        }
        Insert: {
          action_id: string
          modified_at?: string
          value: number
        }
        Update: {
          action_id?: string
          modified_at?: string
          value?: number
        }
      }
      action_definition: {
        Row: {
          action_id: string
          categorie: Database["public"]["Enums"]["action_categorie"] | null
          contexte: string
          description: string
          exemples: string
          identifiant: string
          modified_at: string
          nom: string
          perimetre_evaluation: string
          points: number | null
          pourcentage: number | null
          preuve: string | null
          reduction_potentiel: string
          referentiel: Database["public"]["Enums"]["referentiel"]
          ressources: string
        }
        Insert: {
          action_id: string
          categorie?: Database["public"]["Enums"]["action_categorie"] | null
          contexte: string
          description: string
          exemples: string
          identifiant: string
          modified_at?: string
          nom: string
          perimetre_evaluation: string
          points?: number | null
          pourcentage?: number | null
          preuve?: string | null
          reduction_potentiel: string
          referentiel: Database["public"]["Enums"]["referentiel"]
          ressources: string
        }
        Update: {
          action_id?: string
          categorie?: Database["public"]["Enums"]["action_categorie"] | null
          contexte?: string
          description?: string
          exemples?: string
          identifiant?: string
          modified_at?: string
          nom?: string
          perimetre_evaluation?: string
          points?: number | null
          pourcentage?: number | null
          preuve?: string | null
          reduction_potentiel?: string
          referentiel?: Database["public"]["Enums"]["referentiel"]
          ressources?: string
        }
      }
      action_discussion: {
        Row: {
          action_id: string
          collectivite_id: number
          created_at: string
          created_by: string
          id: number
          modified_at: string
          status: Database["public"]["Enums"]["action_discussion_statut"]
        }
        Insert: {
          action_id: string
          collectivite_id: number
          created_at?: string
          created_by?: string
          id?: number
          modified_at?: string
          status?: Database["public"]["Enums"]["action_discussion_statut"]
        }
        Update: {
          action_id?: string
          collectivite_id?: number
          created_at?: string
          created_by?: string
          id?: number
          modified_at?: string
          status?: Database["public"]["Enums"]["action_discussion_statut"]
        }
      }
      action_discussion_commentaire: {
        Row: {
          created_at: string
          created_by: string
          discussion_id: number
          id: number
          message: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          discussion_id: number
          id?: number
          message: string
        }
        Update: {
          created_at?: string
          created_by?: string
          discussion_id?: number
          id?: number
          message?: string
        }
      }
      action_relation: {
        Row: {
          id: string
          parent: string | null
          referentiel: Database["public"]["Enums"]["referentiel"]
        }
        Insert: {
          id: string
          parent?: string | null
          referentiel: Database["public"]["Enums"]["referentiel"]
        }
        Update: {
          id?: string
          parent?: string | null
          referentiel?: Database["public"]["Enums"]["referentiel"]
        }
      }
      action_statut: {
        Row: {
          action_id: string
          avancement: Database["public"]["Enums"]["avancement"]
          avancement_detaille: number[] | null
          collectivite_id: number
          concerne: boolean
          modified_at: string
          modified_by: string
        }
        Insert: {
          action_id: string
          avancement: Database["public"]["Enums"]["avancement"]
          avancement_detaille?: number[] | null
          collectivite_id: number
          concerne: boolean
          modified_at?: string
          modified_by?: string
        }
        Update: {
          action_id?: string
          avancement?: Database["public"]["Enums"]["avancement"]
          avancement_detaille?: number[] | null
          collectivite_id?: number
          concerne?: boolean
          modified_at?: string
          modified_by?: string
        }
      }
      annexe: {
        Row: {
          collectivite_id: number
          commentaire: string
          fichier_id: number | null
          id: number
          lien: Json | null
          modified_at: string
          modified_by: string
          titre: string
          url: string | null
        }
        Insert: {
          collectivite_id: number
          commentaire?: string
          fichier_id?: number | null
          id?: number
          lien?: Json | null
          modified_at?: string
          modified_by?: string
          titre?: string
          url?: string | null
        }
        Update: {
          collectivite_id?: number
          commentaire?: string
          fichier_id?: number | null
          id?: number
          lien?: Json | null
          modified_at?: string
          modified_by?: string
          titre?: string
          url?: string | null
        }
      }
      audit_auditeur: {
        Row: {
          audit_id: number
          auditeur: string
          created_at: string | null
        }
        Insert: {
          audit_id: number
          auditeur: string
          created_at?: string | null
        }
        Update: {
          audit_id?: number
          auditeur?: string
          created_at?: string | null
        }
      }
      axe: {
        Row: {
          collectivite_id: number
          created_at: string
          id: number
          modified_at: string
          modified_by: string | null
          nom: string | null
          parent: number | null
        }
        Insert: {
          collectivite_id: number
          created_at?: string
          id?: number
          modified_at?: string
          modified_by?: string | null
          nom?: string | null
          parent?: number | null
        }
        Update: {
          collectivite_id?: number
          created_at?: string
          id?: number
          modified_at?: string
          modified_by?: string | null
          nom?: string | null
          parent?: number | null
        }
      }
      client_scores: {
        Row: {
          collectivite_id: number
          modified_at: string
          payload_timestamp: string | null
          referentiel: Database["public"]["Enums"]["referentiel"]
          scores: Json
        }
        Insert: {
          collectivite_id: number
          modified_at: string
          payload_timestamp?: string | null
          referentiel: Database["public"]["Enums"]["referentiel"]
          scores: Json
        }
        Update: {
          collectivite_id?: number
          modified_at?: string
          payload_timestamp?: string | null
          referentiel?: Database["public"]["Enums"]["referentiel"]
          scores?: Json
        }
      }
      client_scores_update: {
        Row: {
          collectivite_id: number
          modified_at: string
          referentiel: Database["public"]["Enums"]["referentiel"]
        }
        Insert: {
          collectivite_id: number
          modified_at: string
          referentiel: Database["public"]["Enums"]["referentiel"]
        }
        Update: {
          collectivite_id?: number
          modified_at?: string
          referentiel?: Database["public"]["Enums"]["referentiel"]
        }
      }
      collectivite: {
        Row: {
          access_restreint: boolean
          created_at: string
          id: number
          modified_at: string
        }
        Insert: {
          access_restreint?: boolean
          created_at?: string
          id?: number
          modified_at?: string
        }
        Update: {
          access_restreint?: boolean
          created_at?: string
          id?: number
          modified_at?: string
        }
      }
      collectivite_bucket: {
        Row: {
          bucket_id: string
          collectivite_id: number
        }
        Insert: {
          bucket_id: string
          collectivite_id: number
        }
        Update: {
          bucket_id?: string
          collectivite_id?: number
        }
      }
      collectivite_test: {
        Row: {
          collectivite_id: number | null
          id: number
          nom: string
        }
        Insert: {
          collectivite_id?: number | null
          id?: number
          nom: string
        }
        Update: {
          collectivite_id?: number | null
          id?: number
          nom?: string
        }
      }
      commune: {
        Row: {
          code: string
          collectivite_id: number | null
          id: number
          nom: string
        }
        Insert: {
          code: string
          collectivite_id?: number | null
          id?: number
          nom: string
        }
        Update: {
          code?: string
          collectivite_id?: number | null
          id?: number
          nom?: string
        }
      }
      cot: {
        Row: {
          actif: boolean
          collectivite_id: number
        }
        Insert: {
          actif: boolean
          collectivite_id: number
        }
        Update: {
          actif?: boolean
          collectivite_id?: number
        }
      }
      dcp: {
        Row: {
          cgu_acceptees_le: string | null
          created_at: string
          deleted: boolean
          email: string
          limited: boolean
          modified_at: string
          nom: string
          prenom: string
          telephone: string | null
          user_id: string
        }
        Insert: {
          cgu_acceptees_le?: string | null
          created_at?: string
          deleted?: boolean
          email: string
          limited?: boolean
          modified_at?: string
          nom: string
          prenom: string
          telephone?: string | null
          user_id: string
        }
        Update: {
          cgu_acceptees_le?: string | null
          created_at?: string
          deleted?: boolean
          email?: string
          limited?: boolean
          modified_at?: string
          nom?: string
          prenom?: string
          telephone?: string | null
          user_id?: string
        }
      }
      epci: {
        Row: {
          collectivite_id: number | null
          id: number
          nature: Database["public"]["Enums"]["nature"]
          nom: string
          siren: string
        }
        Insert: {
          collectivite_id?: number | null
          id?: number
          nature: Database["public"]["Enums"]["nature"]
          nom: string
          siren: string
        }
        Update: {
          collectivite_id?: number | null
          id?: number
          nature?: Database["public"]["Enums"]["nature"]
          nom?: string
          siren?: string
        }
      }
      fiche_action: {
        Row: {
          amelioration_continue: boolean | null
          budget_previsionnel: number | null
          calendrier: string | null
          cibles: Database["public"]["Enums"]["fiche_action_cibles"][] | null
          collectivite_id: number
          created_at: string
          date_debut: string | null
          date_fin_provisoire: string | null
          description: string | null
          financements: string | null
          id: number
          maj_termine: boolean | null
          modified_at: string
          modified_by: string | null
          niveau_priorite:
            | Database["public"]["Enums"]["fiche_action_niveaux_priorite"]
            | null
          notes_complementaires: string | null
          objectifs: string | null
          piliers_eci:
            | Database["public"]["Enums"]["fiche_action_piliers_eci"][]
            | null
          ressources: string | null
          resultats_attendus:
            | Database["public"]["Enums"]["fiche_action_resultats_attendus"][]
            | null
          statut: Database["public"]["Enums"]["fiche_action_statuts"] | null
          titre: string | null
        }
        Insert: {
          amelioration_continue?: boolean | null
          budget_previsionnel?: number | null
          calendrier?: string | null
          cibles?: Database["public"]["Enums"]["fiche_action_cibles"][] | null
          collectivite_id: number
          created_at?: string
          date_debut?: string | null
          date_fin_provisoire?: string | null
          description?: string | null
          financements?: string | null
          id?: number
          maj_termine?: boolean | null
          modified_at?: string
          modified_by?: string | null
          niveau_priorite?:
            | Database["public"]["Enums"]["fiche_action_niveaux_priorite"]
            | null
          notes_complementaires?: string | null
          objectifs?: string | null
          piliers_eci?:
            | Database["public"]["Enums"]["fiche_action_piliers_eci"][]
            | null
          ressources?: string | null
          resultats_attendus?:
            | Database["public"]["Enums"]["fiche_action_resultats_attendus"][]
            | null
          statut?: Database["public"]["Enums"]["fiche_action_statuts"] | null
          titre?: string | null
        }
        Update: {
          amelioration_continue?: boolean | null
          budget_previsionnel?: number | null
          calendrier?: string | null
          cibles?: Database["public"]["Enums"]["fiche_action_cibles"][] | null
          collectivite_id?: number
          created_at?: string
          date_debut?: string | null
          date_fin_provisoire?: string | null
          description?: string | null
          financements?: string | null
          id?: number
          maj_termine?: boolean | null
          modified_at?: string
          modified_by?: string | null
          niveau_priorite?:
            | Database["public"]["Enums"]["fiche_action_niveaux_priorite"]
            | null
          notes_complementaires?: string | null
          objectifs?: string | null
          piliers_eci?:
            | Database["public"]["Enums"]["fiche_action_piliers_eci"][]
            | null
          ressources?: string | null
          resultats_attendus?:
            | Database["public"]["Enums"]["fiche_action_resultats_attendus"][]
            | null
          statut?: Database["public"]["Enums"]["fiche_action_statuts"] | null
          titre?: string | null
        }
      }
      fiche_action_action: {
        Row: {
          action_id: string
          fiche_id: number
        }
        Insert: {
          action_id: string
          fiche_id: number
        }
        Update: {
          action_id?: string
          fiche_id?: number
        }
      }
      fiche_action_annexe: {
        Row: {
          annexe_id: number
          fiche_id: number
        }
        Insert: {
          annexe_id: number
          fiche_id: number
        }
        Update: {
          annexe_id?: number
          fiche_id?: number
        }
      }
      fiche_action_axe: {
        Row: {
          axe_id: number
          fiche_id: number
        }
        Insert: {
          axe_id: number
          fiche_id: number
        }
        Update: {
          axe_id?: number
          fiche_id?: number
        }
      }
      fiche_action_financeur_tag: {
        Row: {
          fiche_id: number
          financeur_tag_id: number
          id: number
          montant_ttc: number | null
        }
        Insert: {
          fiche_id: number
          financeur_tag_id: number
          id?: number
          montant_ttc?: number | null
        }
        Update: {
          fiche_id?: number
          financeur_tag_id?: number
          id?: number
          montant_ttc?: number | null
        }
      }
      fiche_action_import_csv: {
        Row: {
          amelioration_continue: string | null
          axe: string | null
          budget: string | null
          calendrier: string | null
          cibles: string | null
          collectivite_id: string | null
          date_debut: string | null
          date_fin: string | null
          description: string | null
          elu_referent: string | null
          financements: string | null
          financeur_deux: string | null
          financeur_trois: string | null
          financeur_un: string | null
          montant_deux: string | null
          montant_trois: string | null
          montant_un: string | null
          moyens: string | null
          notes: string | null
          num_action: string | null
          objectifs: string | null
          partenaires: string | null
          personne_referente: string | null
          plan_nom: string | null
          priorite: string | null
          resultats_attendus: string | null
          service: string | null
          sous_axe: string | null
          sous_sous_axe: string | null
          statut: string | null
          structure_pilote: string | null
          titre: string | null
        }
        Insert: {
          amelioration_continue?: string | null
          axe?: string | null
          budget?: string | null
          calendrier?: string | null
          cibles?: string | null
          collectivite_id?: string | null
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          elu_referent?: string | null
          financements?: string | null
          financeur_deux?: string | null
          financeur_trois?: string | null
          financeur_un?: string | null
          montant_deux?: string | null
          montant_trois?: string | null
          montant_un?: string | null
          moyens?: string | null
          notes?: string | null
          num_action?: string | null
          objectifs?: string | null
          partenaires?: string | null
          personne_referente?: string | null
          plan_nom?: string | null
          priorite?: string | null
          resultats_attendus?: string | null
          service?: string | null
          sous_axe?: string | null
          sous_sous_axe?: string | null
          statut?: string | null
          structure_pilote?: string | null
          titre?: string | null
        }
        Update: {
          amelioration_continue?: string | null
          axe?: string | null
          budget?: string | null
          calendrier?: string | null
          cibles?: string | null
          collectivite_id?: string | null
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          elu_referent?: string | null
          financements?: string | null
          financeur_deux?: string | null
          financeur_trois?: string | null
          financeur_un?: string | null
          montant_deux?: string | null
          montant_trois?: string | null
          montant_un?: string | null
          moyens?: string | null
          notes?: string | null
          num_action?: string | null
          objectifs?: string | null
          partenaires?: string | null
          personne_referente?: string | null
          plan_nom?: string | null
          priorite?: string | null
          resultats_attendus?: string | null
          service?: string | null
          sous_axe?: string | null
          sous_sous_axe?: string | null
          statut?: string | null
          structure_pilote?: string | null
          titre?: string | null
        }
      }
      fiche_action_indicateur: {
        Row: {
          fiche_id: number
          indicateur_id: string | null
          indicateur_personnalise_id: number | null
        }
        Insert: {
          fiche_id: number
          indicateur_id?: string | null
          indicateur_personnalise_id?: number | null
        }
        Update: {
          fiche_id?: number
          indicateur_id?: string | null
          indicateur_personnalise_id?: number | null
        }
      }
      fiche_action_lien: {
        Row: {
          fiche_deux: number
          fiche_une: number
        }
        Insert: {
          fiche_deux: number
          fiche_une: number
        }
        Update: {
          fiche_deux?: number
          fiche_une?: number
        }
      }
      fiche_action_partenaire_tag: {
        Row: {
          fiche_id: number
          partenaire_tag_id: number
        }
        Insert: {
          fiche_id: number
          partenaire_tag_id: number
        }
        Update: {
          fiche_id?: number
          partenaire_tag_id?: number
        }
      }
      fiche_action_pilote: {
        Row: {
          fiche_id: number
          tag_id: number | null
          user_id: string | null
        }
        Insert: {
          fiche_id: number
          tag_id?: number | null
          user_id?: string | null
        }
        Update: {
          fiche_id?: number
          tag_id?: number | null
          user_id?: string | null
        }
      }
      fiche_action_referent: {
        Row: {
          fiche_id: number
          tag_id: number | null
          user_id: string | null
        }
        Insert: {
          fiche_id: number
          tag_id?: number | null
          user_id?: string | null
        }
        Update: {
          fiche_id?: number
          tag_id?: number | null
          user_id?: string | null
        }
      }
      fiche_action_service_tag: {
        Row: {
          fiche_id: number
          service_tag_id: number
        }
        Insert: {
          fiche_id: number
          service_tag_id: number
        }
        Update: {
          fiche_id?: number
          service_tag_id?: number
        }
      }
      fiche_action_sous_thematique: {
        Row: {
          fiche_id: number
          thematique_id: number
        }
        Insert: {
          fiche_id: number
          thematique_id: number
        }
        Update: {
          fiche_id?: number
          thematique_id?: number
        }
      }
      fiche_action_structure_tag: {
        Row: {
          fiche_id: number
          structure_tag_id: number
        }
        Insert: {
          fiche_id: number
          structure_tag_id: number
        }
        Update: {
          fiche_id?: number
          structure_tag_id?: number
        }
      }
      fiche_action_thematique: {
        Row: {
          fiche_id: number
          thematique: string
        }
        Insert: {
          fiche_id: number
          thematique: string
        }
        Update: {
          fiche_id?: number
          thematique?: string
        }
      }
      filtre_intervalle: {
        Row: {
          id: string
          intervalle: unknown
          libelle: string
          type: Database["public"]["Enums"]["collectivite_filtre_type"]
        }
        Insert: {
          id: string
          intervalle: unknown
          libelle: string
          type: Database["public"]["Enums"]["collectivite_filtre_type"]
        }
        Update: {
          id?: string
          intervalle?: unknown
          libelle?: string
          type?: Database["public"]["Enums"]["collectivite_filtre_type"]
        }
      }
      financeur_tag: {
        Row: {
          collectivite_id: number
          id: number
          nom: string
        }
        Insert: {
          collectivite_id: number
          id?: number
          nom: string
        }
        Update: {
          collectivite_id?: number
          id?: number
          nom?: string
        }
      }
      indicateur_action: {
        Row: {
          action_id: string
          indicateur_id: string
          modified_at: string
        }
        Insert: {
          action_id: string
          indicateur_id: string
          modified_at?: string
        }
        Update: {
          action_id?: string
          indicateur_id?: string
          modified_at?: string
        }
      }
      indicateur_commentaire: {
        Row: {
          collectivite_id: number
          commentaire: string
          indicateur_id: string
          modified_at: string
          modified_by: string
        }
        Insert: {
          collectivite_id: number
          commentaire: string
          indicateur_id: string
          modified_at?: string
          modified_by?: string
        }
        Update: {
          collectivite_id?: number
          commentaire?: string
          indicateur_id?: string
          modified_at?: string
          modified_by?: string
        }
      }
      indicateur_definition: {
        Row: {
          description: string
          id: string
          identifiant: string
          indicateur_group: Database["public"]["Enums"]["indicateur_group"]
          modified_at: string
          nom: string
          obligation_eci: boolean
          parent: number | null
          unite: string
          valeur_indicateur: string | null
        }
        Insert: {
          description: string
          id: string
          identifiant: string
          indicateur_group: Database["public"]["Enums"]["indicateur_group"]
          modified_at?: string
          nom: string
          obligation_eci: boolean
          parent?: number | null
          unite: string
          valeur_indicateur?: string | null
        }
        Update: {
          description?: string
          id?: string
          identifiant?: string
          indicateur_group?: Database["public"]["Enums"]["indicateur_group"]
          modified_at?: string
          nom?: string
          obligation_eci?: boolean
          parent?: number | null
          unite?: string
          valeur_indicateur?: string | null
        }
      }
      indicateur_objectif: {
        Row: {
          annee: number
          collectivite_id: number
          indicateur_id: string
          modified_at: string
          valeur: number | null
        }
        Insert: {
          annee: number
          collectivite_id: number
          indicateur_id: string
          modified_at?: string
          valeur?: number | null
        }
        Update: {
          annee?: number
          collectivite_id?: number
          indicateur_id?: string
          modified_at?: string
          valeur?: number | null
        }
      }
      indicateur_parent: {
        Row: {
          id: number
          nom: string
          numero: string
        }
        Insert: {
          id?: number
          nom: string
          numero: string
        }
        Update: {
          id?: number
          nom?: string
          numero?: string
        }
      }
      indicateur_personnalise_definition: {
        Row: {
          collectivite_id: number | null
          commentaire: string
          description: string
          id: number
          modified_at: string
          modified_by: string
          titre: string
          unite: string
        }
        Insert: {
          collectivite_id?: number | null
          commentaire: string
          description: string
          id?: number
          modified_at?: string
          modified_by?: string
          titre: string
          unite: string
        }
        Update: {
          collectivite_id?: number | null
          commentaire?: string
          description?: string
          id?: number
          modified_at?: string
          modified_by?: string
          titre?: string
          unite?: string
        }
      }
      indicateur_personnalise_objectif: {
        Row: {
          annee: number
          collectivite_id: number
          indicateur_id: number
          modified_at: string
          valeur: number | null
        }
        Insert: {
          annee: number
          collectivite_id: number
          indicateur_id: number
          modified_at?: string
          valeur?: number | null
        }
        Update: {
          annee?: number
          collectivite_id?: number
          indicateur_id?: number
          modified_at?: string
          valeur?: number | null
        }
      }
      indicateur_personnalise_resultat: {
        Row: {
          annee: number
          collectivite_id: number
          indicateur_id: number
          modified_at: string
          valeur: number | null
        }
        Insert: {
          annee: number
          collectivite_id: number
          indicateur_id: number
          modified_at?: string
          valeur?: number | null
        }
        Update: {
          annee?: number
          collectivite_id?: number
          indicateur_id?: number
          modified_at?: string
          valeur?: number | null
        }
      }
      indicateur_resultat: {
        Row: {
          annee: number
          collectivite_id: number
          indicateur_id: string
          modified_at: string
          valeur: number | null
        }
        Insert: {
          annee: number
          collectivite_id: number
          indicateur_id: string
          modified_at?: string
          valeur?: number | null
        }
        Update: {
          annee?: number
          collectivite_id?: number
          indicateur_id?: string
          modified_at?: string
          valeur?: number | null
        }
      }
      indicateur_terristory_json: {
        Row: {
          created_at: string
          indicateurs: Json
        }
        Insert: {
          created_at?: string
          indicateurs: Json
        }
        Update: {
          created_at?: string
          indicateurs?: Json
        }
      }
      indicateurs_json: {
        Row: {
          created_at: string
          indicateurs: Json
        }
        Insert: {
          created_at?: string
          indicateurs: Json
        }
        Update: {
          created_at?: string
          indicateurs?: Json
        }
      }
      labellisation: {
        Row: {
          annee: number | null
          collectivite_id: number | null
          etoiles: number
          id: number
          obtenue_le: string
          referentiel: Database["public"]["Enums"]["referentiel"]
          score_programme: number | null
          score_realise: number | null
        }
        Insert: {
          annee?: number | null
          collectivite_id?: number | null
          etoiles: number
          id?: number
          obtenue_le: string
          referentiel: Database["public"]["Enums"]["referentiel"]
          score_programme?: number | null
          score_realise?: number | null
        }
        Update: {
          annee?: number | null
          collectivite_id?: number | null
          etoiles?: number
          id?: number
          obtenue_le?: string
          referentiel?: Database["public"]["Enums"]["referentiel"]
          score_programme?: number | null
          score_realise?: number | null
        }
      }
      labellisation_action_critere: {
        Row: {
          action_id: string
          etoile: Database["labellisation"]["Enums"]["etoile"]
          formulation: string
          min_programme_percentage: number | null
          min_programme_score: number | null
          min_realise_percentage: number | null
          min_realise_score: number | null
          prio: number
          referentiel: Database["public"]["Enums"]["referentiel"]
        }
        Insert: {
          action_id: string
          etoile: Database["labellisation"]["Enums"]["etoile"]
          formulation: string
          min_programme_percentage?: number | null
          min_programme_score?: number | null
          min_realise_percentage?: number | null
          min_realise_score?: number | null
          prio: number
          referentiel: Database["public"]["Enums"]["referentiel"]
        }
        Update: {
          action_id?: string
          etoile?: Database["labellisation"]["Enums"]["etoile"]
          formulation?: string
          min_programme_percentage?: number | null
          min_programme_score?: number | null
          min_realise_percentage?: number | null
          min_realise_score?: number | null
          prio?: number
          referentiel?: Database["public"]["Enums"]["referentiel"]
        }
      }
      labellisation_calendrier: {
        Row: {
          information: string
          referentiel: Database["public"]["Enums"]["referentiel"]
        }
        Insert: {
          information: string
          referentiel: Database["public"]["Enums"]["referentiel"]
        }
        Update: {
          information?: string
          referentiel?: Database["public"]["Enums"]["referentiel"]
        }
      }
      labellisation_fichier_critere: {
        Row: {
          description: string
          etoile: Database["labellisation"]["Enums"]["etoile"]
          referentiel: Database["public"]["Enums"]["referentiel"]
        }
        Insert: {
          description: string
          etoile: Database["labellisation"]["Enums"]["etoile"]
          referentiel: Database["public"]["Enums"]["referentiel"]
        }
        Update: {
          description?: string
          etoile?: Database["labellisation"]["Enums"]["etoile"]
          referentiel?: Database["public"]["Enums"]["referentiel"]
        }
      }
      maintenance: {
        Row: {
          begins_at: string
          ends_at: string
          id: number
        }
        Insert: {
          begins_at: string
          ends_at: string
          id?: number
        }
        Update: {
          begins_at?: string
          ends_at?: string
          id?: number
        }
      }
      partenaire_tag: {
        Row: {
          collectivite_id: number
          id: number
          nom: string
        }
        Insert: {
          collectivite_id: number
          id?: number
          nom: string
        }
        Update: {
          collectivite_id?: number
          id?: number
          nom?: string
        }
      }
      personnalisation: {
        Row: {
          action_id: string
          description: string
          titre: string
        }
        Insert: {
          action_id: string
          description: string
          titre: string
        }
        Update: {
          action_id?: string
          description?: string
          titre?: string
        }
      }
      personnalisation_consequence: {
        Row: {
          collectivite_id: number
          consequences: Json
          modified_at: string
          payload_timestamp: string | null
        }
        Insert: {
          collectivite_id: number
          consequences: Json
          modified_at?: string
          payload_timestamp?: string | null
        }
        Update: {
          collectivite_id?: number
          consequences?: Json
          modified_at?: string
          payload_timestamp?: string | null
        }
      }
      personnalisation_regle: {
        Row: {
          action_id: string
          description: string
          formule: string
          modified_at: string
          type: Database["public"]["Enums"]["regle_type"]
        }
        Insert: {
          action_id: string
          description: string
          formule: string
          modified_at?: string
          type: Database["public"]["Enums"]["regle_type"]
        }
        Update: {
          action_id?: string
          description?: string
          formule?: string
          modified_at?: string
          type?: Database["public"]["Enums"]["regle_type"]
        }
      }
      personnalisations_json: {
        Row: {
          created_at: string
          questions: Json
          regles: Json
        }
        Insert: {
          created_at?: string
          questions: Json
          regles: Json
        }
        Update: {
          created_at?: string
          questions?: Json
          regles?: Json
        }
      }
      personne_tag: {
        Row: {
          collectivite_id: number
          id: number
          nom: string
        }
        Insert: {
          collectivite_id: number
          id?: number
          nom: string
        }
        Update: {
          collectivite_id?: number
          id?: number
          nom?: string
        }
      }
      pre_audit_scores: {
        Row: {
          audit_id: number
          collectivite_id: number
          modified_at: string
          payload_timestamp: string | null
          referentiel: Database["public"]["Enums"]["referentiel"]
          scores: Json
        }
        Insert: {
          audit_id: number
          collectivite_id: number
          modified_at: string
          payload_timestamp?: string | null
          referentiel: Database["public"]["Enums"]["referentiel"]
          scores: Json
        }
        Update: {
          audit_id?: number
          collectivite_id?: number
          modified_at?: string
          payload_timestamp?: string | null
          referentiel?: Database["public"]["Enums"]["referentiel"]
          scores?: Json
        }
      }
      preuve_action: {
        Row: {
          action_id: string
          preuve_id: string
        }
        Insert: {
          action_id: string
          preuve_id: string
        }
        Update: {
          action_id?: string
          preuve_id?: string
        }
      }
      preuve_audit: {
        Row: {
          audit_id: number
          collectivite_id: number
          commentaire: string
          fichier_id: number | null
          id: number
          lien: Json | null
          modified_at: string
          modified_by: string
          titre: string
          url: string | null
        }
        Insert: {
          audit_id: number
          collectivite_id: number
          commentaire?: string
          fichier_id?: number | null
          id?: number
          lien?: Json | null
          modified_at?: string
          modified_by?: string
          titre?: string
          url?: string | null
        }
        Update: {
          audit_id?: number
          collectivite_id?: number
          commentaire?: string
          fichier_id?: number | null
          id?: number
          lien?: Json | null
          modified_at?: string
          modified_by?: string
          titre?: string
          url?: string | null
        }
      }
      preuve_complementaire: {
        Row: {
          action_id: string
          collectivite_id: number
          commentaire: string
          fichier_id: number | null
          id: number
          lien: Json | null
          modified_at: string
          modified_by: string
          titre: string
          url: string | null
        }
        Insert: {
          action_id: string
          collectivite_id: number
          commentaire?: string
          fichier_id?: number | null
          id?: number
          lien?: Json | null
          modified_at?: string
          modified_by?: string
          titre?: string
          url?: string | null
        }
        Update: {
          action_id?: string
          collectivite_id?: number
          commentaire?: string
          fichier_id?: number | null
          id?: number
          lien?: Json | null
          modified_at?: string
          modified_by?: string
          titre?: string
          url?: string | null
        }
      }
      preuve_labellisation: {
        Row: {
          collectivite_id: number
          commentaire: string
          demande_id: number
          fichier_id: number | null
          id: number
          lien: Json | null
          modified_at: string
          modified_by: string
          titre: string
          url: string | null
        }
        Insert: {
          collectivite_id: number
          commentaire?: string
          demande_id: number
          fichier_id?: number | null
          id?: number
          lien?: Json | null
          modified_at?: string
          modified_by?: string
          titre?: string
          url?: string | null
        }
        Update: {
          collectivite_id?: number
          commentaire?: string
          demande_id?: number
          fichier_id?: number | null
          id?: number
          lien?: Json | null
          modified_at?: string
          modified_by?: string
          titre?: string
          url?: string | null
        }
      }
      preuve_rapport: {
        Row: {
          collectivite_id: number
          commentaire: string
          date: string
          fichier_id: number | null
          id: number
          lien: Json | null
          modified_at: string
          modified_by: string
          titre: string
          url: string | null
        }
        Insert: {
          collectivite_id: number
          commentaire?: string
          date: string
          fichier_id?: number | null
          id?: number
          lien?: Json | null
          modified_at?: string
          modified_by?: string
          titre?: string
          url?: string | null
        }
        Update: {
          collectivite_id?: number
          commentaire?: string
          date?: string
          fichier_id?: number | null
          id?: number
          lien?: Json | null
          modified_at?: string
          modified_by?: string
          titre?: string
          url?: string | null
        }
      }
      preuve_reglementaire: {
        Row: {
          collectivite_id: number
          commentaire: string
          fichier_id: number | null
          id: number
          lien: Json | null
          modified_at: string
          modified_by: string
          preuve_id: string
          titre: string
          url: string | null
        }
        Insert: {
          collectivite_id: number
          commentaire?: string
          fichier_id?: number | null
          id?: number
          lien?: Json | null
          modified_at?: string
          modified_by?: string
          preuve_id: string
          titre?: string
          url?: string | null
        }
        Update: {
          collectivite_id?: number
          commentaire?: string
          fichier_id?: number | null
          id?: number
          lien?: Json | null
          modified_at?: string
          modified_by?: string
          preuve_id?: string
          titre?: string
          url?: string | null
        }
      }
      preuve_reglementaire_definition: {
        Row: {
          description: string
          id: string
          nom: string
        }
        Insert: {
          description: string
          id: string
          nom: string
        }
        Update: {
          description?: string
          id?: string
          nom?: string
        }
      }
      preuve_reglementaire_json: {
        Row: {
          created_at: string
          preuves: Json
        }
        Insert: {
          created_at?: string
          preuves: Json
        }
        Update: {
          created_at?: string
          preuves?: Json
        }
      }
      private_collectivite_membre: {
        Row: {
          champ_intervention:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          collectivite_id: number
          created_at: string
          details_fonction: string | null
          fonction: Database["public"]["Enums"]["membre_fonction"] | null
          modified_at: string
          user_id: string
        }
        Insert: {
          champ_intervention?:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          collectivite_id: number
          created_at?: string
          details_fonction?: string | null
          fonction?: Database["public"]["Enums"]["membre_fonction"] | null
          modified_at?: string
          user_id: string
        }
        Update: {
          champ_intervention?:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          collectivite_id?: number
          created_at?: string
          details_fonction?: string | null
          fonction?: Database["public"]["Enums"]["membre_fonction"] | null
          modified_at?: string
          user_id?: string
        }
      }
      private_utilisateur_droit: {
        Row: {
          active: boolean
          collectivite_id: number
          created_at: string
          id: number
          invitation_id: string | null
          modified_at: string
          niveau_acces: Database["public"]["Enums"]["niveau_acces"]
          user_id: string
        }
        Insert: {
          active: boolean
          collectivite_id: number
          created_at?: string
          id?: number
          invitation_id?: string | null
          modified_at?: string
          niveau_acces?: Database["public"]["Enums"]["niveau_acces"]
          user_id: string
        }
        Update: {
          active?: boolean
          collectivite_id?: number
          created_at?: string
          id?: number
          invitation_id?: string | null
          modified_at?: string
          niveau_acces?: Database["public"]["Enums"]["niveau_acces"]
          user_id?: string
        }
      }
      question: {
        Row: {
          description: string
          formulation: string
          id: string
          ordonnancement: number | null
          thematique_id: string | null
          type: Database["public"]["Enums"]["question_type"]
          types_collectivites_concernees:
            | Database["public"]["Enums"]["type_collectivite"][]
            | null
        }
        Insert: {
          description: string
          formulation: string
          id: string
          ordonnancement?: number | null
          thematique_id?: string | null
          type: Database["public"]["Enums"]["question_type"]
          types_collectivites_concernees?:
            | Database["public"]["Enums"]["type_collectivite"][]
            | null
        }
        Update: {
          description?: string
          formulation?: string
          id?: string
          ordonnancement?: number | null
          thematique_id?: string | null
          type?: Database["public"]["Enums"]["question_type"]
          types_collectivites_concernees?:
            | Database["public"]["Enums"]["type_collectivite"][]
            | null
        }
      }
      question_action: {
        Row: {
          action_id: string
          question_id: string
        }
        Insert: {
          action_id: string
          question_id: string
        }
        Update: {
          action_id?: string
          question_id?: string
        }
      }
      question_choix: {
        Row: {
          formulation: string | null
          id: string
          ordonnancement: number | null
          question_id: string | null
        }
        Insert: {
          formulation?: string | null
          id: string
          ordonnancement?: number | null
          question_id?: string | null
        }
        Update: {
          formulation?: string | null
          id?: string
          ordonnancement?: number | null
          question_id?: string | null
        }
      }
      question_thematique: {
        Row: {
          id: string
          nom: string | null
        }
        Insert: {
          id: string
          nom?: string | null
        }
        Update: {
          id?: string
          nom?: string | null
        }
      }
      referentiel_json: {
        Row: {
          children: Json
          created_at: string
          definitions: Json
        }
        Insert: {
          children: Json
          created_at?: string
          definitions: Json
        }
        Update: {
          children?: Json
          created_at?: string
          definitions?: Json
        }
      }
      reponse_binaire: {
        Row: {
          collectivite_id: number
          modified_at: string
          question_id: string
          reponse: boolean | null
        }
        Insert: {
          collectivite_id: number
          modified_at?: string
          question_id: string
          reponse?: boolean | null
        }
        Update: {
          collectivite_id?: number
          modified_at?: string
          question_id?: string
          reponse?: boolean | null
        }
      }
      reponse_choix: {
        Row: {
          collectivite_id: number
          modified_at: string
          question_id: string
          reponse: string | null
        }
        Insert: {
          collectivite_id: number
          modified_at?: string
          question_id: string
          reponse?: string | null
        }
        Update: {
          collectivite_id?: number
          modified_at?: string
          question_id?: string
          reponse?: string | null
        }
      }
      reponse_proportion: {
        Row: {
          collectivite_id: number
          modified_at: string
          question_id: string
          reponse: number | null
        }
        Insert: {
          collectivite_id: number
          modified_at?: string
          question_id: string
          reponse?: number | null
        }
        Update: {
          collectivite_id?: number
          modified_at?: string
          question_id?: string
          reponse?: number | null
        }
      }
      service_tag: {
        Row: {
          collectivite_id: number
          id: number
          nom: string
        }
        Insert: {
          collectivite_id: number
          id?: number
          nom: string
        }
        Update: {
          collectivite_id?: number
          id?: number
          nom?: string
        }
      }
      sous_thematique: {
        Row: {
          id: number
          sous_thematique: string
          thematique: string
        }
        Insert: {
          id?: number
          sous_thematique: string
          thematique: string
        }
        Update: {
          id?: number
          sous_thematique?: string
          thematique?: string
        }
      }
      structure_tag: {
        Row: {
          collectivite_id: number
          id: number
          nom: string
        }
        Insert: {
          collectivite_id: number
          id?: number
          nom: string
        }
        Update: {
          collectivite_id?: number
          id?: number
          nom?: string
        }
      }
      thematique: {
        Row: {
          thematique: string
        }
        Insert: {
          thematique: string
        }
        Update: {
          thematique?: string
        }
      }
      type_tabular_score: {
        Row: {
          action_id: string | null
          avancement: Database["public"]["Enums"]["avancement"] | null
          concerne: boolean | null
          desactive: boolean | null
          points_max_personnalises: number | null
          points_max_referentiel: number | null
          points_programmes: number | null
          points_realises: number | null
          points_restants: number | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          score_non_renseigne: number | null
          score_pas_fait: number | null
          score_programme: number | null
          score_realise: number | null
          score_realise_plus_programme: number | null
        }
        Insert: {
          action_id?: string | null
          avancement?: Database["public"]["Enums"]["avancement"] | null
          concerne?: boolean | null
          desactive?: boolean | null
          points_max_personnalises?: number | null
          points_max_referentiel?: number | null
          points_programmes?: number | null
          points_realises?: number | null
          points_restants?: number | null
          referentiel?: Database["public"]["Enums"]["referentiel"] | null
          score_non_renseigne?: number | null
          score_pas_fait?: number | null
          score_programme?: number | null
          score_realise?: number | null
          score_realise_plus_programme?: number | null
        }
        Update: {
          action_id?: string | null
          avancement?: Database["public"]["Enums"]["avancement"] | null
          concerne?: boolean | null
          desactive?: boolean | null
          points_max_personnalises?: number | null
          points_max_referentiel?: number | null
          points_programmes?: number | null
          points_realises?: number | null
          points_restants?: number | null
          referentiel?: Database["public"]["Enums"]["referentiel"] | null
          score_non_renseigne?: number | null
          score_pas_fait?: number | null
          score_programme?: number | null
          score_realise?: number | null
          score_realise_plus_programme?: number | null
        }
      }
      usage: {
        Row: {
          action: Database["public"]["Enums"]["usage_action"]
          collectivite_id: number | null
          fonction: Database["public"]["Enums"]["usage_fonction"]
          page: Database["public"]["Enums"]["visite_page"] | null
          time: string
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["usage_action"]
          collectivite_id?: number | null
          fonction: Database["public"]["Enums"]["usage_fonction"]
          page?: Database["public"]["Enums"]["visite_page"] | null
          time?: string
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["usage_action"]
          collectivite_id?: number | null
          fonction?: Database["public"]["Enums"]["usage_fonction"]
          page?: Database["public"]["Enums"]["visite_page"] | null
          time?: string
          user_id?: string | null
        }
      }
      visite: {
        Row: {
          collectivite_id: number | null
          onglet: Database["public"]["Enums"]["visite_onglet"] | null
          page: Database["public"]["Enums"]["visite_page"]
          tag: Database["public"]["Enums"]["visite_tag"] | null
          time: string
          user_id: string | null
        }
        Insert: {
          collectivite_id?: number | null
          onglet?: Database["public"]["Enums"]["visite_onglet"] | null
          page: Database["public"]["Enums"]["visite_page"]
          tag?: Database["public"]["Enums"]["visite_tag"] | null
          time?: string
          user_id?: string | null
        }
        Update: {
          collectivite_id?: number | null
          onglet?: Database["public"]["Enums"]["visite_onglet"] | null
          page?: Database["public"]["Enums"]["visite_page"]
          tag?: Database["public"]["Enums"]["visite_tag"] | null
          time?: string
          user_id?: string | null
        }
      }
    }
    Views: {
      action_audit_state: {
        Row: {
          action_id: string | null
          audit_id: number | null
          avis: string | null
          collectivite_id: number | null
          ordre_du_jour: boolean | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          state_id: number | null
          statut: Database["public"]["Enums"]["audit_statut"] | null
        }
      }
      action_children: {
        Row: {
          children: unknown[] | null
          depth: number | null
          id: string | null
        }
      }
      action_definition_summary: {
        Row: {
          children: unknown[] | null
          depth: number | null
          description: string | null
          have_contexte: boolean | null
          have_exemples: boolean | null
          have_perimetre_evaluation: boolean | null
          have_preuve: boolean | null
          have_questions: boolean | null
          have_reduction_potentiel: boolean | null
          have_ressources: boolean | null
          id: string | null
          identifiant: string | null
          nom: string | null
          phase: Database["public"]["Enums"]["action_categorie"] | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          type: Database["public"]["Enums"]["action_type"] | null
        }
      }
      action_discussion_feed: {
        Row: {
          action_id: string | null
          collectivite_id: number | null
          commentaires: Json[] | null
          created_at: string | null
          created_by: string | null
          id: number | null
          modified_at: string | null
          status: Database["public"]["Enums"]["action_discussion_statut"] | null
        }
      }
      action_statuts: {
        Row: {
          action_id: string | null
          ascendants: unknown[] | null
          avancement: Database["public"]["Enums"]["avancement"] | null
          avancement_descendants:
            | Database["public"]["Enums"]["avancement"][]
            | null
          avancement_detaille: number[] | null
          collectivite_id: number | null
          concerne: boolean | null
          depth: number | null
          desactive: boolean | null
          descendants: unknown[] | null
          description: string | null
          have_children: boolean | null
          have_contexte: boolean | null
          have_exemples: boolean | null
          have_perimetre_evaluation: boolean | null
          have_preuve: boolean | null
          have_reduction_potentiel: boolean | null
          have_ressources: boolean | null
          identifiant: string | null
          nom: string | null
          non_concerne: boolean | null
          phase: Database["public"]["Enums"]["action_categorie"] | null
          points_max_personnalises: number | null
          points_max_referentiel: number | null
          points_programmes: number | null
          points_realises: number | null
          points_restants: number | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          score_non_renseigne: number | null
          score_pas_fait: number | null
          score_programme: number | null
          score_realise: number | null
          score_realise_plus_programme: number | null
          type: Database["public"]["Enums"]["action_type"] | null
        }
      }
      action_title: {
        Row: {
          children: unknown[] | null
          id: string | null
          identifiant: string | null
          nom: string | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          type: Database["public"]["Enums"]["action_type"] | null
        }
      }
      active_collectivite: {
        Row: {
          collectivite_id: number | null
          nom: string | null
        }
      }
      audit: {
        Row: {
          collectivite_id: number | null
          date_debut: string | null
          date_fin: string | null
          demande_id: number | null
          id: number | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          valide: boolean | null
        }
        Insert: {
          collectivite_id?: number | null
          date_debut?: string | null
          date_fin?: string | null
          demande_id?: number | null
          id?: number | null
          referentiel?: Database["public"]["Enums"]["referentiel"] | null
          valide?: boolean | null
        }
        Update: {
          collectivite_id?: number | null
          date_debut?: string | null
          date_fin?: string | null
          demande_id?: number | null
          id?: number | null
          referentiel?: Database["public"]["Enums"]["referentiel"] | null
          valide?: boolean | null
        }
      }
      audit_en_cours: {
        Row: {
          collectivite_id: number | null
          date_debut: string | null
          date_fin: string | null
          demande_id: number | null
          id: number | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          valide: boolean | null
        }
        Insert: {
          collectivite_id?: number | null
          date_debut?: string | null
          date_fin?: string | null
          demande_id?: number | null
          id?: number | null
          referentiel?: Database["public"]["Enums"]["referentiel"] | null
          valide?: boolean | null
        }
        Update: {
          collectivite_id?: number | null
          date_debut?: string | null
          date_fin?: string | null
          demande_id?: number | null
          id?: number | null
          referentiel?: Database["public"]["Enums"]["referentiel"] | null
          valide?: boolean | null
        }
      }
      auditeurs: {
        Row: {
          audit_id: number | null
          collectivite_id: number | null
          noms: Json | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
        }
      }
      audits: {
        Row: {
          audit: unknown | null
          collectivite_id: number | null
          demande: unknown | null
          is_cot: boolean | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
        }
      }
      axe_descendants: {
        Row: {
          axe_id: number | null
          depth: number | null
          descendants: number[] | null
          parents: number[] | null
        }
      }
      bibliotheque_fichier: {
        Row: {
          bucket_id: string | null
          collectivite_id: number | null
          file_id: string | null
          filename: string | null
          filesize: number | null
          hash: string | null
          id: number | null
        }
      }
      business_action_children: {
        Row: {
          children: unknown[] | null
          id: string | null
          parent: string | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
        }
      }
      business_action_statut: {
        Row: {
          action_id: string | null
          avancement: Database["public"]["Enums"]["avancement"] | null
          avancement_detaille: number[] | null
          collectivite_id: number | null
          concerne: boolean | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
        }
      }
      business_reponse: {
        Row: {
          collectivite_id: number | null
          reponses: Json[] | null
        }
      }
      client_action_statut: {
        Row: {
          action_id: string | null
          avancement: Database["public"]["Enums"]["avancement"] | null
          collectivite_id: number | null
          concerne: boolean | null
          modified_by: string | null
        }
        Insert: {
          action_id?: string | null
          avancement?: Database["public"]["Enums"]["avancement"] | null
          collectivite_id?: number | null
          concerne?: boolean | null
          modified_by?: string | null
        }
        Update: {
          action_id?: string | null
          avancement?: Database["public"]["Enums"]["avancement"] | null
          collectivite_id?: number | null
          concerne?: boolean | null
          modified_by?: string | null
        }
      }
      collectivite_carte_identite: {
        Row: {
          code_siren_insee: string | null
          collectivite_id: number | null
          departement_name: string | null
          is_cot: boolean | null
          nom: string | null
          population_source: string | null
          population_totale: number | null
          region_name: string | null
          type_collectivite:
            | Database["public"]["Enums"]["type_collectivite"]
            | null
        }
      }
      collectivite_identite: {
        Row: {
          id: number | null
          localisation: string[] | null
          population: string[] | null
          type: Database["public"]["Enums"]["type_collectivite"][] | null
        }
      }
      collectivite_niveau_acces: {
        Row: {
          access_restreint: boolean | null
          collectivite_id: number | null
          est_auditeur: boolean | null
          niveau_acces: Database["public"]["Enums"]["niveau_acces"] | null
          nom: string | null
        }
      }
      comparaison_scores_audit: {
        Row: {
          action_id: string | null
          collectivite_id: number | null
          courant: Database["public"]["CompositeTypes"]["tabular_score"] | null
          pre_audit:
            | Database["public"]["CompositeTypes"]["tabular_score"]
            | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
        }
      }
      departement: {
        Row: {
          code: string | null
          libelle: string | null
          region_code: string | null
        }
        Insert: {
          code?: string | null
          libelle?: string | null
          region_code?: string | null
        }
        Update: {
          code?: string | null
          libelle?: string | null
          region_code?: string | null
        }
      }
      fiche_action_personne_pilote: {
        Row: {
          collectivite_id: number | null
          nom: string | null
          tag_id: number | null
          user_id: string | null
        }
      }
      fiche_action_personne_referente: {
        Row: {
          collectivite_id: number | null
          nom: string | null
          tag_id: number | null
          user_id: string | null
        }
      }
      fiche_resume: {
        Row: {
          collectivite_id: number | null
          fiche_id: number | null
          fiche_nom: string | null
          fiche_statut:
            | Database["public"]["Enums"]["fiche_action_statuts"]
            | null
          plans: unknown[] | null
        }
      }
      fiches_action: {
        Row: {
          actions: unknown[] | null
          amelioration_continue: boolean | null
          annexes: unknown[] | null
          axes: unknown[] | null
          budget_previsionnel: number | null
          calendrier: string | null
          cibles: Database["public"]["Enums"]["fiche_action_cibles"][] | null
          collectivite_id: number | null
          created_at: string | null
          date_debut: string | null
          date_fin_provisoire: string | null
          description: string | null
          fiches_liees: unknown[] | null
          financements: string | null
          financeurs:
            | Database["public"]["CompositeTypes"]["financeur_montant"][]
            | null
          id: number | null
          indicateurs:
            | Database["public"]["CompositeTypes"]["indicateur_generique"][]
            | null
          maj_termine: boolean | null
          modified_at: string | null
          modified_by: string | null
          niveau_priorite:
            | Database["public"]["Enums"]["fiche_action_niveaux_priorite"]
            | null
          notes_complementaires: string | null
          objectifs: string | null
          partenaires: unknown[] | null
          piliers_eci:
            | Database["public"]["Enums"]["fiche_action_piliers_eci"][]
            | null
          pilotes: Database["public"]["CompositeTypes"]["personne"][] | null
          referents: Database["public"]["CompositeTypes"]["personne"][] | null
          ressources: string | null
          resultats_attendus:
            | Database["public"]["Enums"]["fiche_action_resultats_attendus"][]
            | null
          services: unknown[] | null
          sous_thematiques: unknown[] | null
          statut: Database["public"]["Enums"]["fiche_action_statuts"] | null
          structures: unknown[] | null
          thematiques: unknown[] | null
          titre: string | null
        }
      }
      fiches_liees_par_fiche: {
        Row: {
          fiche_id: number | null
          fiche_liee_id: number | null
        }
      }
      historique: {
        Row: {
          action_id: string | null
          action_identifiant: string | null
          action_ids: unknown[] | null
          action_nom: string | null
          avancement: Database["public"]["Enums"]["avancement"] | null
          avancement_detaille: number[] | null
          collectivite_id: number | null
          concerne: boolean | null
          modified_at: string | null
          modified_by_id: string | null
          modified_by_nom: string | null
          precision: string | null
          previous_avancement: Database["public"]["Enums"]["avancement"] | null
          previous_avancement_detaille: number[] | null
          previous_concerne: boolean | null
          previous_modified_at: string | null
          previous_modified_by_id: string | null
          previous_precision: string | null
          previous_reponse: Json | null
          question_formulation: string | null
          question_id: string | null
          question_type: Database["public"]["Enums"]["question_type"] | null
          reponse: Json | null
          tache_identifiant: string | null
          tache_nom: string | null
          thematique_id: string | null
          thematique_nom: string | null
          type: string | null
        }
      }
      historique_utilisateur: {
        Row: {
          collectivite_id: number | null
          modified_by_id: string | null
          modified_by_nom: string | null
        }
      }
      indicateurs_collectivite: {
        Row: {
          collectivite_id: number | null
          description: string | null
          indicateur_id: string | null
          indicateur_personnalise_id: number | null
          nom: string | null
          unite: string | null
        }
      }
      mes_collectivites: {
        Row: {
          collectivite_id: number | null
          est_auditeur: boolean | null
          niveau_acces: Database["public"]["Enums"]["niveau_acces"] | null
          nom: string | null
        }
      }
      named_collectivite: {
        Row: {
          collectivite_id: number | null
          nom: string | null
        }
      }
      ongoing_maintenance: {
        Row: {
          begins_at: string | null
          ends_at: string | null
          now: string | null
        }
      }
      pg_all_foreign_keys: {
        Row: {
          fk_columns: unknown[] | null
          fk_constraint_name: unknown | null
          fk_schema_name: unknown | null
          fk_table_name: unknown | null
          fk_table_oid: unknown | null
          is_deferrable: boolean | null
          is_deferred: boolean | null
          match_type: string | null
          on_delete: string | null
          on_update: string | null
          pk_columns: unknown[] | null
          pk_constraint_name: unknown | null
          pk_index_name: unknown | null
          pk_schema_name: unknown | null
          pk_table_name: unknown | null
          pk_table_oid: unknown | null
        }
      }
      plan_action: {
        Row: {
          collectivite_id: number | null
          id: number | null
          plan: Json | null
        }
        Insert: {
          collectivite_id?: number | null
          id?: number | null
          plan?: never
        }
        Update: {
          collectivite_id?: number | null
          id?: number | null
          plan?: never
        }
      }
      plan_action_chemin: {
        Row: {
          axe_id: number | null
          chemin: unknown[] | null
          collectivite_id: number | null
          plan_id: number | null
        }
      }
      plan_action_profondeur: {
        Row: {
          collectivite_id: number | null
          id: number | null
          plan: Json | null
        }
        Insert: {
          collectivite_id?: number | null
          id?: number | null
          plan?: never
        }
        Update: {
          collectivite_id?: number | null
          id?: number | null
          plan?: never
        }
      }
      preuve: {
        Row: {
          action: Json | null
          audit: Json | null
          collectivite_id: number | null
          commentaire: string | null
          created_at: string | null
          created_by: string | null
          created_by_nom: string | null
          demande: Json | null
          fichier: Json | null
          id: number | null
          lien: Json | null
          preuve_reglementaire: Json | null
          preuve_type: Database["public"]["Enums"]["preuve_type"] | null
          rapport: Json | null
        }
      }
      question_display: {
        Row: {
          action_ids: unknown[] | null
          choix: Json[] | null
          collectivite_id: number | null
          description: string | null
          formulation: string | null
          id: string | null
          localisation: string[] | null
          ordonnancement: number | null
          population: string[] | null
          thematique_id: string | null
          thematique_nom: string | null
          type: Database["public"]["Enums"]["question_type"] | null
          types_collectivites_concernees:
            | Database["public"]["Enums"]["type_collectivite"][]
            | null
        }
      }
      question_engine: {
        Row: {
          choix_ids: unknown[] | null
          id: string | null
          type: Database["public"]["Enums"]["question_type"] | null
        }
      }
      question_thematique_completude: {
        Row: {
          collectivite_id: number | null
          completude:
            | Database["public"]["Enums"]["thematique_completude"]
            | null
          id: string | null
          nom: string | null
          referentiels: Database["public"]["Enums"]["referentiel"][] | null
        }
      }
      question_thematique_display: {
        Row: {
          id: string | null
          nom: string | null
          referentiels: Database["public"]["Enums"]["referentiel"][] | null
        }
      }
      region: {
        Row: {
          code: string | null
          libelle: string | null
        }
        Insert: {
          code?: string | null
          libelle?: string | null
        }
        Update: {
          code?: string | null
          libelle?: string | null
        }
      }
      reponse_display: {
        Row: {
          collectivite_id: number | null
          question_id: string | null
          reponse: Json | null
        }
      }
      retool_active_collectivite: {
        Row: {
          collectivite_id: number | null
          nom: string | null
        }
      }
      retool_audit: {
        Row: {
          collectivite_id: number | null
          date_attribution: string | null
          date_debut: string | null
          date_fin: string | null
          envoyee_le: string | null
          nom: string | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          type_audit: string | null
        }
      }
      retool_completude: {
        Row: {
          code_siren_insee: string | null
          collectivite_id: number | null
          completude_cae: number | null
          completude_eci: number | null
          departement_name: string | null
          nom: string | null
          population_totale: number | null
          region_name: string | null
          type_collectivite:
            | Database["public"]["Enums"]["type_collectivite"]
            | null
        }
      }
      retool_completude_compute: {
        Row: {
          collectivite_id: number | null
          completude_cae: number | null
          completude_eci: number | null
          nom: string | null
        }
      }
      retool_labellisation: {
        Row: {
          annee: number | null
          collectivite_id: number | null
          collectivite_nom: string | null
          etoiles: number | null
          id: number | null
          obtenue_le: string | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          score_programme: number | null
          score_realise: number | null
        }
      }
      retool_labellisation_demande: {
        Row: {
          collectivite_id: number | null
          date: string | null
          en_cours: boolean | null
          envoyee_le: string | null
          etoiles: Database["labellisation"]["Enums"]["etoile"] | null
          id: number | null
          modified_at: string | null
          nom: string | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          sujet: Database["labellisation"]["Enums"]["sujet_demande"] | null
        }
      }
      retool_plan_action_hebdo: {
        Row: {
          collectivite_id: number | null
          contributeurs: string[] | null
          date_range: string | null
          day: string | null
          nb_fiches: number | null
          nb_plans: number | null
          nom: string | null
        }
      }
      retool_plan_action_usage: {
        Row: {
          collectivite_id: number | null
          derniere_modif: string | null
          nb_fiches: number | null
          nb_plans: number | null
          nb_utilisateurs: string | null
          nom: string | null
        }
      }
      retool_preuves: {
        Row: {
          action: string | null
          collectivite_id: number | null
          created_at: string | null
          fichier: string | null
          lien: string | null
          nom: string | null
          preuve_type: Database["public"]["Enums"]["preuve_type"] | null
          referentiel: string | null
        }
      }
      retool_score: {
        Row: {
          Avancement: string | null
          Collectivité: string | null
          collectivite_id: number | null
          Commentaire: string | null
          "Commentaires fusionnés": string | null
          Identifiant: string | null
          "Modifié le": string | null
          "Points potentiels": number | null
          "Points programmés": number | null
          "Points realisés": number | null
          "Pourcentage non renseigné": number | null
          "Pourcentage programmé": number | null
          "Pourcentage réalisé": number | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          Titre: string | null
        }
      }
      retool_stats_usages: {
        Row: {
          admin_champs_intervention_1:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          admin_champs_intervention_10:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          admin_champs_intervention_2:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          admin_champs_intervention_3:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          admin_champs_intervention_4:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          admin_champs_intervention_5:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          admin_champs_intervention_6:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          admin_champs_intervention_7:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          admin_champs_intervention_8:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          admin_champs_intervention_9:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          admin_derniere_connexion_1: string | null
          admin_derniere_connexion_10: string | null
          admin_derniere_connexion_2: string | null
          admin_derniere_connexion_3: string | null
          admin_derniere_connexion_4: string | null
          admin_derniere_connexion_5: string | null
          admin_derniere_connexion_6: string | null
          admin_derniere_connexion_7: string | null
          admin_derniere_connexion_8: string | null
          admin_derniere_connexion_9: string | null
          admin_detail_fonction_1: string | null
          admin_detail_fonction_10: string | null
          admin_detail_fonction_2: string | null
          admin_detail_fonction_3: string | null
          admin_detail_fonction_4: string | null
          admin_detail_fonction_5: string | null
          admin_detail_fonction_6: string | null
          admin_detail_fonction_7: string | null
          admin_detail_fonction_8: string | null
          admin_detail_fonction_9: string | null
          admin_email_1: string | null
          admin_email_10: string | null
          admin_email_2: string | null
          admin_email_3: string | null
          admin_email_4: string | null
          admin_email_5: string | null
          admin_email_6: string | null
          admin_email_7: string | null
          admin_email_8: string | null
          admin_email_9: string | null
          admin_fonction_1:
            | Database["public"]["Enums"]["membre_fonction"]
            | null
          admin_fonction_10:
            | Database["public"]["Enums"]["membre_fonction"]
            | null
          admin_fonction_2:
            | Database["public"]["Enums"]["membre_fonction"]
            | null
          admin_fonction_3:
            | Database["public"]["Enums"]["membre_fonction"]
            | null
          admin_fonction_4:
            | Database["public"]["Enums"]["membre_fonction"]
            | null
          admin_fonction_5:
            | Database["public"]["Enums"]["membre_fonction"]
            | null
          admin_fonction_6:
            | Database["public"]["Enums"]["membre_fonction"]
            | null
          admin_fonction_7:
            | Database["public"]["Enums"]["membre_fonction"]
            | null
          admin_fonction_8:
            | Database["public"]["Enums"]["membre_fonction"]
            | null
          admin_fonction_9:
            | Database["public"]["Enums"]["membre_fonction"]
            | null
          admin_nom_1: string | null
          admin_nom_10: string | null
          admin_nom_2: string | null
          admin_nom_3: string | null
          admin_nom_4: string | null
          admin_nom_5: string | null
          admin_nom_6: string | null
          admin_nom_7: string | null
          admin_nom_8: string | null
          admin_nom_9: string | null
          admin_prenom_1: string | null
          admin_prenom_10: string | null
          admin_prenom_2: string | null
          admin_prenom_3: string | null
          admin_prenom_4: string | null
          admin_prenom_5: string | null
          admin_prenom_6: string | null
          admin_prenom_7: string | null
          admin_prenom_8: string | null
          admin_prenom_9: string | null
          admin_telephone_1: string | null
          admin_telephone_10: string | null
          admin_telephone_2: string | null
          admin_telephone_3: string | null
          admin_telephone_4: string | null
          admin_telephone_5: string | null
          admin_telephone_6: string | null
          admin_telephone_7: string | null
          admin_telephone_8: string | null
          admin_telephone_9: string | null
          code_siren_insee: string | null
          collectivite_id: number | null
          completude_cae: number | null
          completude_eci: number | null
          cot: boolean | null
          date_activation: string | null
          departement_code: string | null
          departement_name: string | null
          nature_collectivite: Database["public"]["Enums"]["nature"] | null
          nb_admin: number | null
          nb_ecriture: number | null
          nb_fiches: number | null
          nb_indicateurs: number | null
          nb_indicateurs_cae: number | null
          nb_indicateurs_eci: number | null
          nb_indicateurs_personnalises: number | null
          nb_lecture: number | null
          nb_plans: number | null
          nb_users_actifs: number | null
          nb_valeurs_indicateurs: number | null
          niveau_label_cae: number | null
          niveau_label_eci: number | null
          nom: string | null
          population_totale: number | null
          programme_courant_cae: number | null
          programme_courant_eci: number | null
          programme_label_cae: number | null
          programme_label_eci: number | null
          realise_courant_cae: number | null
          realise_courant_eci: number | null
          realise_label_cae: number | null
          realise_label_eci: number | null
          region_code: string | null
          region_name: string | null
          type_collectivite:
            | Database["public"]["Enums"]["filterable_type_collectivite"]
            | null
        }
      }
      retool_user_collectivites_list: {
        Row: {
          collectivites: string[] | null
          creation: string | null
          derniere_connexion: string | null
          email: string | null
          nb_collectivite: number | null
          nom: string | null
          prenom: string | null
        }
      }
      retool_user_list: {
        Row: {
          active: boolean | null
          champ_intervention:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          collectivite: string | null
          collectivite_id: number | null
          details_fonction: string | null
          droit_id: number | null
          email: string | null
          fonction: Database["public"]["Enums"]["membre_fonction"] | null
          niveau_acces: Database["public"]["Enums"]["niveau_acces"] | null
          nom: string | null
          prenom: string | null
          telephone: string | null
          user_id: string | null
        }
      }
      stats_active_real_collectivites: {
        Row: {
          collectivite_id: number | null
          nom: string | null
        }
      }
      stats_carte_collectivite_active: {
        Row: {
          code_siren_insee: string | null
          collectivite_id: number | null
          departement_code: string | null
          departement_name: string | null
          geojson: Json | null
          nature_collectivite: string | null
          nom: string | null
          population_totale: number | null
          region_code: string | null
          region_name: string | null
          type_collectivite:
            | Database["public"]["Enums"]["type_collectivite"]
            | null
        }
      }
      stats_carte_epci_par_departement: {
        Row: {
          actives: number | null
          geojson: Json | null
          insee: string | null
          libelle: string | null
          total: number | null
        }
      }
      stats_collectivite_actives_et_total_par_type: {
        Row: {
          actives: number | null
          total: number | null
          type_collectivite: string | null
        }
      }
      stats_engagement_collectivite: {
        Row: {
          collectivite_id: number | null
          cot: boolean | null
          etoiles_cae: number | null
          etoiles_eci: number | null
        }
      }
      stats_evolution_collectivite_avec_minimum_fiches: {
        Row: {
          collectivites: number | null
          mois: string | null
        }
      }
      stats_evolution_indicateur_referentiel: {
        Row: {
          indicateurs: number | null
          mois: string | null
        }
      }
      stats_evolution_nombre_fiches: {
        Row: {
          fiches: number | null
          mois: string | null
        }
      }
      stats_evolution_nombre_utilisateur_par_collectivite: {
        Row: {
          maximum: number | null
          median: number | null
          mois: string | null
          moyen: number | null
        }
      }
      stats_evolution_resultat_indicateur_personnalise: {
        Row: {
          mois: string | null
          resultats: number | null
        }
      }
      stats_evolution_resultat_indicateur_referentiel: {
        Row: {
          mois: string | null
          resultats: number | null
        }
      }
      stats_evolution_total_activation_par_type: {
        Row: {
          mois: string | null
          total: number | null
          total_commune: number | null
          total_epci: number | null
          total_syndicat: number | null
        }
      }
      stats_evolution_utilisateur: {
        Row: {
          mois: string | null
          total_utilisateurs: number | null
          utilisateurs: number | null
        }
      }
      stats_labellisation_par_niveau: {
        Row: {
          etoiles: number | null
          labellisations: number | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
        }
      }
      stats_locales_collectivite_actives_et_total_par_type: {
        Row: {
          actives: number | null
          code_departement: string | null
          code_region: string | null
          total: number | null
          typologie: string | null
        }
      }
      stats_locales_engagement_collectivite: {
        Row: {
          code_departement: string | null
          code_region: string | null
          collectivite_id: number | null
          cot: boolean | null
          etoiles_cae: number | null
          etoiles_eci: number | null
        }
      }
      stats_locales_evolution_collectivite_avec_indicateur: {
        Row: {
          code_departement: string | null
          code_region: string | null
          collectivites: number | null
          mois: string | null
        }
      }
      stats_locales_evolution_collectivite_avec_minimum_fiches: {
        Row: {
          code_departement: string | null
          code_region: string | null
          collectivites: number | null
          mois: string | null
        }
      }
      stats_locales_evolution_indicateur_referentiel: {
        Row: {
          code_departement: string | null
          code_region: string | null
          indicateurs: number | null
          mois: string | null
        }
      }
      stats_locales_evolution_nombre_fiches: {
        Row: {
          code_departement: string | null
          code_region: string | null
          fiches: number | null
          mois: string | null
        }
      }
      stats_locales_evolution_nombre_utilisateur_par_collectivite: {
        Row: {
          code_departement: string | null
          code_region: string | null
          maximum: number | null
          median: number | null
          mois: string | null
          moyen: number | null
        }
      }
      stats_locales_evolution_resultat_indicateur_personnalise: {
        Row: {
          code_departement: string | null
          code_region: string | null
          indicateurs: number | null
          mois: string | null
        }
      }
      stats_locales_evolution_resultat_indicateur_referentiel: {
        Row: {
          code_departement: string | null
          code_region: string | null
          indicateurs: number | null
          mois: string | null
        }
      }
      stats_locales_evolution_total_activation: {
        Row: {
          code_departement: string | null
          code_region: string | null
          mois: string | null
          total: number | null
          total_commune: number | null
          total_epci: number | null
          total_syndicat: number | null
        }
      }
      stats_locales_evolution_utilisateur: {
        Row: {
          code_departement: string | null
          code_region: string | null
          mois: string | null
          total_utilisateurs: number | null
          utilisateurs: number | null
        }
      }
      stats_locales_labellisation_par_niveau: {
        Row: {
          code_departement: string | null
          code_region: string | null
          etoiles: number | null
          labellisations: number | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
        }
      }
      stats_locales_tranche_completude: {
        Row: {
          cae: number | null
          code_departement: string | null
          code_region: string | null
          eci: number | null
          lower_bound: number | null
          upper_bound: number | null
        }
      }
      suivi_audit: {
        Row: {
          action_id: string | null
          avis: string | null
          collectivite_id: number | null
          have_children: boolean | null
          ordre_du_jour: boolean | null
          ordres_du_jour: boolean[] | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          statut: Database["public"]["Enums"]["audit_statut"] | null
          statuts: Database["public"]["Enums"]["audit_statut"][] | null
          type: Database["public"]["Enums"]["action_type"] | null
        }
      }
      tap_funky: {
        Row: {
          args: string | null
          is_definer: boolean | null
          is_strict: boolean | null
          is_visible: boolean | null
          kind: unknown | null
          langoid: unknown | null
          name: unknown | null
          oid: unknown | null
          owner: unknown | null
          returns: string | null
          returns_set: boolean | null
          schema: unknown | null
          volatility: string | null
        }
      }
    }
    Functions: {
      _cleanup: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      _contract_on: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      _currtest: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      _db_privs: {
        Args: Record<PropertyKey, never>
        Returns: unknown[]
      }
      _definer: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _dexists: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _expand_context: {
        Args: {
          "": string
        }
        Returns: string
      }
      _expand_on: {
        Args: {
          "": string
        }
        Returns: string
      }
      _expand_vol: {
        Args: {
          "": string
        }
        Returns: string
      }
      _ext_exists: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _extensions:
        | {
            Args: {
              "": unknown
            }
            Returns: unknown[]
          }
        | {
            Args: Record<PropertyKey, never>
            Returns: unknown[]
          }
      _funkargs: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      _get: {
        Args: {
          "": string
        }
        Returns: number
      }
      _get_db_owner: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _get_dtype: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      _get_language_owner: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _get_latest: {
        Args: {
          "": string
        }
        Returns: number[]
      }
      _get_note:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": number
            }
            Returns: string
          }
      _get_opclass_owner: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _get_rel_owner: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _get_schema_owner: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _get_tablespace_owner: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _get_type_owner: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _got_func: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _grolist: {
        Args: {
          "": unknown
        }
        Returns: unknown[]
      }
      _has_group: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _has_role: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _has_user: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _inherited: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _is_schema: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _is_super: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _is_trusted: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _is_verbose: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      _lang: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _opc_exists: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _parts: {
        Args: {
          "": unknown
        }
        Returns: unknown[]
      }
      _pg_sv_type_array: {
        Args: {
          "": unknown[]
        }
        Returns: unknown[]
      }
      _prokind: {
        Args: {
          p_oid: unknown
        }
        Returns: unknown
      }
      _query: {
        Args: {
          "": string
        }
        Returns: string
      }
      _refine_vol: {
        Args: {
          "": string
        }
        Returns: string
      }
      _relexists: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _returns: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      _strict: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _table_privs: {
        Args: Record<PropertyKey, never>
        Returns: unknown[]
      }
      _temptypes: {
        Args: {
          "": string
        }
        Returns: string
      }
      _todo: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _vol: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      accepter_cgu: {
        Args: Record<PropertyKey, never>
        Returns: {
          cgu_acceptees_le: string | null
          created_at: string
          deleted: boolean
          email: string
          limited: boolean
          modified_at: string
          nom: string
          prenom: string
          telephone: string | null
          user_id: string
        }
      }
      action_contexte: {
        Args: {
          id: unknown
        }
        Returns: Record<string, unknown>
      }
      action_down_to_tache: {
        Args: {
          referentiel: Database["public"]["Enums"]["referentiel"]
          identifiant: string
        }
        Returns: {
          children: unknown[] | null
          depth: number | null
          description: string | null
          have_contexte: boolean | null
          have_exemples: boolean | null
          have_perimetre_evaluation: boolean | null
          have_preuve: boolean | null
          have_questions: boolean | null
          have_reduction_potentiel: boolean | null
          have_ressources: boolean | null
          id: string | null
          identifiant: string | null
          nom: string | null
          phase: Database["public"]["Enums"]["action_categorie"] | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          type: Database["public"]["Enums"]["action_type"] | null
        }[]
      }
      action_exemples: {
        Args: {
          id: unknown
        }
        Returns: Record<string, unknown>
      }
      action_perimetre_evaluation: {
        Args: {
          id: unknown
        }
        Returns: Record<string, unknown>
      }
      action_preuve: {
        Args: {
          id: unknown
        }
        Returns: Record<string, unknown>
      }
      action_reduction_potentiel: {
        Args: {
          id: unknown
        }
        Returns: Record<string, unknown>
      }
      action_ressources: {
        Args: {
          id: unknown
        }
        Returns: Record<string, unknown>
      }
      add_bibliotheque_fichier: {
        Args: {
          collectivite_id: number
          hash: string
          filename: string
        }
        Returns: {
          bucket_id: string | null
          collectivite_id: number | null
          file_id: string | null
          filename: string | null
          filesize: number | null
          hash: string | null
          id: number | null
        }
      }
      add_compression_policy: {
        Args: {
          hypertable: unknown
          compress_after: unknown
          if_not_exists?: boolean
          schedule_interval?: unknown
          initial_start?: string
          timezone?: string
        }
        Returns: number
      }
      add_continuous_aggregate_policy: {
        Args: {
          continuous_aggregate: unknown
          start_offset: unknown
          end_offset: unknown
          schedule_interval: unknown
          if_not_exists?: boolean
          initial_start?: string
          timezone?: string
        }
        Returns: number
      }
      add_data_node: {
        Args: {
          node_name: unknown
          host: string
          database?: unknown
          port?: number
          if_not_exists?: boolean
          bootstrap?: boolean
          password?: string
        }
        Returns: {
          node_name: unknown
          host: string
          port: number
          database: unknown
          node_created: boolean
          database_created: boolean
          extension_created: boolean
        }[]
      }
      add_dimension: {
        Args: {
          hypertable: unknown
          column_name: unknown
          number_partitions?: number
          chunk_time_interval?: unknown
          partitioning_func?: unknown
          if_not_exists?: boolean
        }
        Returns: {
          dimension_id: number
          schema_name: unknown
          table_name: unknown
          column_name: unknown
          created: boolean
        }[]
      }
      add_job: {
        Args: {
          proc: unknown
          schedule_interval: unknown
          config?: Json
          initial_start?: string
          scheduled?: boolean
          check_config?: unknown
          fixed_schedule?: boolean
          timezone?: string
        }
        Returns: number
      }
      add_reorder_policy: {
        Args: {
          hypertable: unknown
          index_name: unknown
          if_not_exists?: boolean
          initial_start?: string
          timezone?: string
        }
        Returns: number
      }
      add_retention_policy: {
        Args: {
          relation: unknown
          drop_after: unknown
          if_not_exists?: boolean
          schedule_interval?: unknown
          initial_start?: string
          timezone?: string
        }
        Returns: number
      }
      add_user: {
        Args: {
          collectivite_id: number
          email: string
          niveau: Database["public"]["Enums"]["niveau_acces"]
        }
        Returns: Json
      }
      ajouter_action: {
        Args: {
          fiche_id: number
          action_id: unknown
        }
        Returns: undefined
      }
      ajouter_annexe: {
        Args: {
          fiche_id: number
          annexe: unknown
        }
        Returns: {
          collectivite_id: number
          commentaire: string
          fichier_id: number | null
          id: number
          lien: Json | null
          modified_at: string
          modified_by: string
          titre: string
          url: string | null
        }
      }
      ajouter_fiche_action_dans_un_axe: {
        Args: {
          fiche_id: number
          axe_id: number
        }
        Returns: undefined
      }
      ajouter_financeur: {
        Args: {
          fiche_id: number
          financeur: Database["public"]["CompositeTypes"]["financeur_montant"]
        }
        Returns: Database["public"]["CompositeTypes"]["financeur_montant"]
      }
      ajouter_indicateur: {
        Args: {
          fiche_id: number
          indicateur: Database["public"]["CompositeTypes"]["indicateur_generique"]
        }
        Returns: undefined
      }
      ajouter_partenaire: {
        Args: {
          fiche_id: number
          partenaire: unknown
        }
        Returns: {
          collectivite_id: number
          id: number
          nom: string
        }
      }
      ajouter_pilote: {
        Args: {
          fiche_id: number
          pilote: Database["public"]["CompositeTypes"]["personne"]
        }
        Returns: Database["public"]["CompositeTypes"]["personne"]
      }
      ajouter_referent: {
        Args: {
          fiche_id: number
          referent: Database["public"]["CompositeTypes"]["personne"]
        }
        Returns: Database["public"]["CompositeTypes"]["personne"]
      }
      ajouter_service: {
        Args: {
          fiche_id: number
          service: unknown
        }
        Returns: {
          collectivite_id: number
          id: number
          nom: string
        }
      }
      ajouter_sous_thematique: {
        Args: {
          fiche_id: number
          thematique_id: number
        }
        Returns: undefined
      }
      ajouter_structure: {
        Args: {
          fiche_id: number
          structure: unknown
        }
        Returns: {
          collectivite_id: number
          id: number
          nom: string
        }
      }
      ajouter_thematique: {
        Args: {
          fiche_id: number
          thematique: string
        }
        Returns: undefined
      }
      alter_data_node: {
        Args: {
          node_name: unknown
          host?: string
          database?: unknown
          port?: number
          available?: boolean
        }
        Returns: {
          node_name: unknown
          host: string
          port: number
          database: unknown
          available: boolean
        }[]
      }
      alter_job: {
        Args: {
          job_id: number
          schedule_interval?: unknown
          max_runtime?: unknown
          max_retries?: number
          retry_period?: unknown
          scheduled?: boolean
          config?: Json
          next_start?: string
          if_exists?: boolean
          check_config?: unknown
        }
        Returns: {
          job_id: number
          schedule_interval: unknown
          max_runtime: unknown
          max_retries: number
          retry_period: unknown
          scheduled: boolean
          config: Json
          next_start: string
          check_config: string
        }[]
      }
      approximate_row_count: {
        Args: {
          relation: unknown
        }
        Returns: number
      }
      attach_data_node: {
        Args: {
          node_name: unknown
          hypertable: unknown
          if_not_attached?: boolean
          repartition?: boolean
        }
        Returns: {
          hypertable_id: number
          node_hypertable_id: number
          node_name: unknown
        }[]
      }
      attach_tablespace: {
        Args: {
          tablespace: unknown
          hypertable: unknown
          if_not_attached?: boolean
        }
        Returns: undefined
      }
      business_insert_actions: {
        Args: {
          relations: unknown[]
          definitions: unknown[]
          computed_points: unknown[]
        }
        Returns: undefined
      }
      business_update_actions: {
        Args: {
          definitions: unknown[]
          computed_points: unknown[]
        }
        Returns: undefined
      }
      business_upsert_indicateurs: {
        Args: {
          indicateur_definitions: unknown[]
          indicateur_actions: unknown[]
        }
        Returns: undefined
      }
      can: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      can_read_acces_restreint: {
        Args: {
          collectivite_id: number
        }
        Returns: boolean
      }
      casts_are: {
        Args: {
          "": string[]
        }
        Returns: string
      }
      chunk_compression_stats: {
        Args: {
          hypertable: unknown
        }
        Returns: {
          chunk_schema: unknown
          chunk_name: unknown
          compression_status: string
          before_compression_table_bytes: number
          before_compression_index_bytes: number
          before_compression_toast_bytes: number
          before_compression_total_bytes: number
          after_compression_table_bytes: number
          after_compression_index_bytes: number
          after_compression_toast_bytes: number
          after_compression_total_bytes: number
          node_name: unknown
        }[]
      }
      chunks_detailed_size: {
        Args: {
          hypertable: unknown
        }
        Returns: {
          chunk_schema: unknown
          chunk_name: unknown
          table_bytes: number
          index_bytes: number
          toast_bytes: number
          total_bytes: number
          node_name: unknown
        }[]
      }
      claim_collectivite: {
        Args: {
          id: number
        }
        Returns: Json
      }
      col_is_null:
        | {
            Args: {
              schema_name: unknown
              table_name: unknown
              column_name: unknown
              description?: string
            }
            Returns: string
          }
        | {
            Args: {
              table_name: unknown
              column_name: unknown
              description?: string
            }
            Returns: string
          }
      col_not_null:
        | {
            Args: {
              schema_name: unknown
              table_name: unknown
              column_name: unknown
              description?: string
            }
            Returns: string
          }
        | {
            Args: {
              table_name: unknown
              column_name: unknown
              description?: string
            }
            Returns: string
          }
      collect_tap:
        | {
            Args: Record<PropertyKey, never>
            Returns: string
          }
        | {
            Args: {
              "": string[]
            }
            Returns: string
          }
      collectivite_membres: {
        Args: {
          id: number
        }
        Returns: {
          user_id: string
          prenom: string
          nom: string
          email: string
          telephone: string
          niveau_acces: Database["public"]["Enums"]["niveau_acces"]
          fonction: Database["public"]["Enums"]["membre_fonction"]
          details_fonction: string
          champ_intervention: Database["public"]["Enums"]["referentiel"][]
        }[]
      }
      compress_chunk: {
        Args: {
          uncompressed_chunk: unknown
          if_not_compressed?: boolean
        }
        Returns: unknown
      }
      consume_invitation: {
        Args: {
          id: string
        }
        Returns: undefined
      }
      create_distributed_hypertable: {
        Args: {
          relation: unknown
          time_column_name: unknown
          partitioning_column?: unknown
          number_partitions?: number
          associated_schema_name?: unknown
          associated_table_prefix?: unknown
          chunk_time_interval?: unknown
          create_default_indexes?: boolean
          if_not_exists?: boolean
          partitioning_func?: unknown
          migrate_data?: boolean
          chunk_target_size?: string
          chunk_sizing_func?: unknown
          time_partitioning_func?: unknown
          replication_factor?: number
          data_nodes?: unknown[]
        }
        Returns: {
          hypertable_id: number
          schema_name: unknown
          table_name: unknown
          created: boolean
        }[]
      }
      create_distributed_restore_point: {
        Args: {
          name: string
        }
        Returns: {
          node_name: unknown
          node_type: string
          restore_point: unknown
        }[]
      }
      create_hypertable: {
        Args: {
          relation: unknown
          time_column_name: unknown
          partitioning_column?: unknown
          number_partitions?: number
          associated_schema_name?: unknown
          associated_table_prefix?: unknown
          chunk_time_interval?: unknown
          create_default_indexes?: boolean
          if_not_exists?: boolean
          partitioning_func?: unknown
          migrate_data?: boolean
          chunk_target_size?: string
          chunk_sizing_func?: unknown
          time_partitioning_func?: unknown
          replication_factor?: number
          data_nodes?: unknown[]
          distributed?: boolean
        }
        Returns: {
          hypertable_id: number
          schema_name: unknown
          table_name: unknown
          created: boolean
        }[]
      }
      decompress_chunk: {
        Args: {
          uncompressed_chunk: unknown
          if_compressed?: boolean
        }
        Returns: unknown
      }
      delete_axe_all: {
        Args: {
          axe_id: number
        }
        Returns: undefined
      }
      delete_data_node: {
        Args: {
          node_name: unknown
          if_exists?: boolean
          force?: boolean
          repartition?: boolean
          drop_database?: boolean
        }
        Returns: boolean
      }
      delete_job: {
        Args: {
          job_id: number
        }
        Returns: undefined
      }
      detach_data_node: {
        Args: {
          node_name: unknown
          hypertable?: unknown
          if_attached?: boolean
          force?: boolean
          repartition?: boolean
          drop_remote_data?: boolean
        }
        Returns: number
      }
      detach_tablespace: {
        Args: {
          tablespace: unknown
          hypertable?: unknown
          if_attached?: boolean
        }
        Returns: number
      }
      detach_tablespaces: {
        Args: {
          hypertable: unknown
        }
        Returns: number
      }
      diag:
        | {
            Args: {
              msg: string
            }
            Returns: string
          }
        | {
            Args: {
              msg: unknown
            }
            Returns: string
          }
        | {
            Args: Record<PropertyKey, never>
            Returns: string
          }
        | {
            Args: Record<PropertyKey, never>
            Returns: string
          }
      diag_test_name: {
        Args: {
          "": string
        }
        Returns: string
      }
      do_tap:
        | {
            Args: {
              "": unknown
            }
            Returns: string[]
          }
        | {
            Args: {
              "": string
            }
            Returns: string[]
          }
        | {
            Args: Record<PropertyKey, never>
            Returns: string[]
          }
      domains_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      drop_chunks: {
        Args: {
          relation: unknown
          older_than?: unknown
          newer_than?: unknown
          verbose?: boolean
        }
        Returns: string[]
      }
      enlever_action: {
        Args: {
          fiche_id: number
          action_id: unknown
        }
        Returns: undefined
      }
      enlever_annexe: {
        Args: {
          fiche_id: number
          annexe: unknown
          supprimer: boolean
        }
        Returns: undefined
      }
      enlever_fiche_action_d_un_axe: {
        Args: {
          fiche_id: number
          axe_id: number
        }
        Returns: undefined
      }
      enlever_indicateur: {
        Args: {
          fiche_id: number
          indicateur: Database["public"]["CompositeTypes"]["indicateur_generique"]
        }
        Returns: undefined
      }
      enlever_partenaire: {
        Args: {
          fiche_id: number
          partenaire: unknown
        }
        Returns: undefined
      }
      enlever_pilote: {
        Args: {
          fiche_id: number
          pilote: Database["public"]["CompositeTypes"]["personne"]
        }
        Returns: undefined
      }
      enlever_referent: {
        Args: {
          fiche_id: number
          referent: Database["public"]["CompositeTypes"]["personne"]
        }
        Returns: undefined
      }
      enlever_service: {
        Args: {
          fiche_id: number
          service: unknown
        }
        Returns: undefined
      }
      enlever_sous_thematique: {
        Args: {
          fiche_id: number
          thematique_id: number
        }
        Returns: undefined
      }
      enlever_structure: {
        Args: {
          fiche_id: number
          structure: unknown
        }
        Returns: undefined
      }
      enlever_thematique: {
        Args: {
          fiche_id: number
          thematique: string
        }
        Returns: undefined
      }
      enums_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      est_auditeur: {
        Args: {
          collectivite: number
          referentiel: Database["public"]["Enums"]["referentiel"]
        }
        Returns: boolean
      }
      extensions_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      fail:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: Record<PropertyKey, never>
            Returns: string
          }
      filter_fiches_action: {
        Args: {
          collectivite_id: number
          axes_id?: number[]
          pilotes?: Database["public"]["CompositeTypes"]["personne"][]
          niveaux_priorite?: Database["public"]["Enums"]["fiche_action_niveaux_priorite"][]
          statuts?: Database["public"]["Enums"]["fiche_action_statuts"][]
          referents?: Database["public"]["CompositeTypes"]["personne"][]
        }
        Returns: {
          actions: unknown[] | null
          amelioration_continue: boolean | null
          annexes: unknown[] | null
          axes: unknown[] | null
          budget_previsionnel: number | null
          calendrier: string | null
          cibles: Database["public"]["Enums"]["fiche_action_cibles"][] | null
          collectivite_id: number | null
          created_at: string | null
          date_debut: string | null
          date_fin_provisoire: string | null
          description: string | null
          fiches_liees: unknown[] | null
          financements: string | null
          financeurs:
            | Database["public"]["CompositeTypes"]["financeur_montant"][]
            | null
          id: number | null
          indicateurs:
            | Database["public"]["CompositeTypes"]["indicateur_generique"][]
            | null
          maj_termine: boolean | null
          modified_at: string | null
          modified_by: string | null
          niveau_priorite:
            | Database["public"]["Enums"]["fiche_action_niveaux_priorite"]
            | null
          notes_complementaires: string | null
          objectifs: string | null
          partenaires: unknown[] | null
          piliers_eci:
            | Database["public"]["Enums"]["fiche_action_piliers_eci"][]
            | null
          pilotes: Database["public"]["CompositeTypes"]["personne"][] | null
          referents: Database["public"]["CompositeTypes"]["personne"][] | null
          ressources: string | null
          resultats_attendus:
            | Database["public"]["Enums"]["fiche_action_resultats_attendus"][]
            | null
          services: unknown[] | null
          sous_thematiques: unknown[] | null
          statut: Database["public"]["Enums"]["fiche_action_statuts"] | null
          structures: unknown[] | null
          thematiques: unknown[] | null
          titre: string | null
        }[]
      }
      findfuncs: {
        Args: {
          "": string
        }
        Returns: string[]
      }
      finish: {
        Args: {
          exception_on_failure?: boolean
        }
        Returns: string[]
      }
      foreign_tables_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      functions_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      gbt_bit_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_bool_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_bool_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey2_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey2_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      get_telemetry_report: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      groups_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      has_check: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_composite: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_domain: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_enum: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_extension: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_fk: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_foreign_table: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_function: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_group: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_inherited_tables: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_language: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_materialized_view: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_opclass: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_pk: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_relation: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_role: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_schema: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_sequence: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_table: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_tablespace: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_type: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_unique: {
        Args: {
          "": string
        }
        Returns: string
      }
      has_user: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_view: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_composite: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_domain: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_enum: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_extension: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_fk: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_foreign_table: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_function: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_group: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_inherited_tables: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_language: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_materialized_view: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_opclass: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_pk: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_relation: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_role: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_schema: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_sequence: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_table: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_tablespace: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_type: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_user: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_view: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      have_admin_acces: {
        Args: {
          id: number
        }
        Returns: boolean
      }
      have_discussion_edition_acces: {
        Args: {
          id: number
        }
        Returns: boolean
      }
      have_discussion_lecture_acces: {
        Args: {
          id: number
        }
        Returns: boolean
      }
      have_edition_acces: {
        Args: {
          id: number
        }
        Returns: boolean
      }
      have_lecture_acces: {
        Args: {
          id: number
        }
        Returns: boolean
      }
      have_one_of_niveaux_acces: {
        Args: {
          niveaux: Database["public"]["Enums"]["niveau_acces"][]
          id: number
        }
        Returns: boolean
      }
      hypertable_compression_stats: {
        Args: {
          hypertable: unknown
        }
        Returns: {
          total_chunks: number
          number_compressed_chunks: number
          before_compression_table_bytes: number
          before_compression_index_bytes: number
          before_compression_toast_bytes: number
          before_compression_total_bytes: number
          after_compression_table_bytes: number
          after_compression_index_bytes: number
          after_compression_toast_bytes: number
          after_compression_total_bytes: number
          node_name: unknown
        }[]
      }
      hypertable_detailed_size: {
        Args: {
          hypertable: unknown
        }
        Returns: {
          table_bytes: number
          index_bytes: number
          toast_bytes: number
          total_bytes: number
          node_name: unknown
        }[]
      }
      hypertable_index_size: {
        Args: {
          index_name: unknown
        }
        Returns: number
      }
      hypertable_size: {
        Args: {
          hypertable: unknown
        }
        Returns: number
      }
      in_todo: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      index_is_primary: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      index_is_unique: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      interpolate:
        | {
            Args: {
              value: number
              prev?: Record<string, unknown>
              next?: Record<string, unknown>
            }
            Returns: number
          }
        | {
            Args: {
              value: number
              prev?: Record<string, unknown>
              next?: Record<string, unknown>
            }
            Returns: number
          }
        | {
            Args: {
              value: number
              prev?: Record<string, unknown>
              next?: Record<string, unknown>
            }
            Returns: number
          }
        | {
            Args: {
              value: number
              prev?: Record<string, unknown>
              next?: Record<string, unknown>
            }
            Returns: number
          }
        | {
            Args: {
              value: number
              prev?: Record<string, unknown>
              next?: Record<string, unknown>
            }
            Returns: number
          }
      is_agent_of: {
        Args: {
          id: number
        }
        Returns: boolean
      }
      is_aggregate: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_any_role_on: {
        Args: {
          id: number
        }
        Returns: boolean
      }
      is_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_bucket_writer: {
        Args: {
          id: string
        }
        Returns: boolean
      }
      is_clustered: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_definer: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_empty: {
        Args: {
          "": string
        }
        Returns: string
      }
      is_normal_function: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_partitioned: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_procedure: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_referent_of: {
        Args: {
          id: number
        }
        Returns: boolean
      }
      is_service_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_strict: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_superuser: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_window: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_aggregate: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_definer: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_empty: {
        Args: {
          "": string
        }
        Returns: string
      }
      isnt_normal_function: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_partitioned: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_procedure: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_strict: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_superuser: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_window: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      json_matches_schema: {
        Args: {
          schema: Json
          instance: Json
        }
        Returns: boolean
      }
      jsonb_matches_schema: {
        Args: {
          schema: Json
          instance: Json
        }
        Returns: boolean
      }
      labellisation_cloturer_audit: {
        Args: {
          audit_id: number
          date_fin?: string
        }
        Returns: {
          collectivite_id: number
          date_debut: string | null
          date_fin: string | null
          demande_id: number | null
          id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          valide: boolean
        }
      }
      labellisation_commencer_audit: {
        Args: {
          audit_id: number
          date_debut?: string
        }
        Returns: {
          collectivite_id: number
          date_debut: string | null
          date_fin: string | null
          demande_id: number | null
          id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          valide: boolean
        }
      }
      labellisation_demande: {
        Args: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
        }
        Returns: {
          collectivite_id: number
          date: string
          en_cours: boolean
          envoyee_le: string | null
          etoiles: Database["labellisation"]["Enums"]["etoile"] | null
          id: number
          modified_at: string | null
          referentiel: Database["public"]["Enums"]["referentiel"]
          sujet: Database["labellisation"]["Enums"]["sujet_demande"]
        }
      }
      labellisation_parcours: {
        Args: {
          collectivite_id: number
        }
        Returns: {
          referentiel: Database["public"]["Enums"]["referentiel"]
          etoiles: Database["labellisation"]["Enums"]["etoile"]
          completude_ok: boolean
          critere_score: Json
          criteres_action: Json
          rempli: boolean
          calendrier: string
          demande: Json
          labellisation: Json
          audit: Json
        }[]
      }
      labellisation_peut_commencer_audit: {
        Args: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
        }
        Returns: boolean
      }
      labellisation_submit_demande: {
        Args: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          sujet: Database["labellisation"]["Enums"]["sujet_demande"]
          etoiles?: Database["labellisation"]["Enums"]["etoile"]
        }
        Returns: {
          collectivite_id: number
          date: string
          en_cours: boolean
          envoyee_le: string | null
          etoiles: Database["labellisation"]["Enums"]["etoile"] | null
          id: number
          modified_at: string | null
          referentiel: Database["public"]["Enums"]["referentiel"]
          sujet: Database["labellisation"]["Enums"]["sujet_demande"]
        }
      }
      language_is_trusted: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      languages_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      lives_ok: {
        Args: {
          "": string
        }
        Returns: string
      }
      locf: {
        Args: {
          value: unknown
          prev?: unknown
          treat_null_as_missing?: boolean
        }
        Returns: unknown
      }
      materialized_views_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      move_chunk: {
        Args: {
          chunk: unknown
          destination_tablespace: unknown
          index_destination_tablespace?: unknown
          reorder_index?: unknown
          verbose?: boolean
        }
        Returns: undefined
      }
      naturalsort: {
        Args: {
          "": string
        }
        Returns: string
      }
      no_plan: {
        Args: Record<PropertyKey, never>
        Returns: boolean[]
      }
      num_failed: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      ok: {
        Args: {
          "": boolean
        }
        Returns: string
      }
      opclasses_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      operators_are: {
        Args: {
          "": string[]
        }
        Returns: string
      }
      os_name: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      pass:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: Record<PropertyKey, never>
            Returns: string
          }
      personnes_collectivite: {
        Args: {
          collectivite_id: number
        }
        Returns: Database["public"]["CompositeTypes"]["personne"][]
      }
      peut_lire_la_fiche: {
        Args: {
          fiche_id: number
        }
        Returns: boolean
      }
      peut_modifier_la_fiche: {
        Args: {
          fiche_id: number
        }
        Returns: boolean
      }
      pg_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      pg_version_num: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      pgtap_version: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      plan: {
        Args: {
          "": number
        }
        Returns: string
      }
      plan_action: {
        Args: {
          id: number
        }
        Returns: Json
      }
      plan_action_profondeur: {
        Args: {
          id: number
          profondeur: number
        }
        Returns: Json
      }
      plan_action_tableau_de_bord: {
        Args: {
          collectivite_id: number
          plan_id?: number
          sans_plan?: boolean
        }
        Returns: Database["public"]["CompositeTypes"]["plan_action_tableau_de_bord"]
      }
      plans_action_collectivite: {
        Args: {
          collectivite_id: number
        }
        Returns: {
          collectivite_id: number
          created_at: string
          id: number
          modified_at: string
          modified_by: string | null
          nom: string | null
          parent: number | null
        }[]
      }
      quit_collectivite: {
        Args: {
          id: number
        }
        Returns: Json
      }
      referent_contact: {
        Args: {
          id: number
        }
        Returns: Json
      }
      referent_contacts: {
        Args: {
          id: number
        }
        Returns: {
          prenom: string
          nom: string
          email: string
        }[]
      }
      referentiel_down_to_action: {
        Args: {
          referentiel: Database["public"]["Enums"]["referentiel"]
        }
        Returns: {
          children: unknown[] | null
          depth: number | null
          description: string | null
          have_contexte: boolean | null
          have_exemples: boolean | null
          have_perimetre_evaluation: boolean | null
          have_preuve: boolean | null
          have_questions: boolean | null
          have_reduction_potentiel: boolean | null
          have_ressources: boolean | null
          id: string | null
          identifiant: string | null
          nom: string | null
          phase: Database["public"]["Enums"]["action_categorie"] | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          type: Database["public"]["Enums"]["action_type"] | null
        }[]
      }
      remove_compression_policy: {
        Args: {
          hypertable: unknown
          if_exists?: boolean
        }
        Returns: boolean
      }
      remove_continuous_aggregate_policy: {
        Args: {
          continuous_aggregate: unknown
          if_not_exists?: boolean
          if_exists?: boolean
        }
        Returns: undefined
      }
      remove_membre_from_collectivite: {
        Args: {
          collectivite_id: number
          email: string
        }
        Returns: Json
      }
      remove_reorder_policy: {
        Args: {
          hypertable: unknown
          if_exists?: boolean
        }
        Returns: undefined
      }
      remove_retention_policy: {
        Args: {
          relation: unknown
          if_exists?: boolean
        }
        Returns: undefined
      }
      reorder_chunk: {
        Args: {
          chunk: unknown
          index?: unknown
          verbose?: boolean
        }
        Returns: undefined
      }
      retool_user_list: {
        Args: Record<PropertyKey, never>
        Returns: {
          droit_id: number
          nom: string
          prenom: string
          email: string
          collectivite: string
        }[]
      }
      roles_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      runtests:
        | {
            Args: {
              "": unknown
            }
            Returns: string[]
          }
        | {
            Args: {
              "": string
            }
            Returns: string[]
          }
        | {
            Args: Record<PropertyKey, never>
            Returns: string[]
          }
      save_reponse: {
        Args: {
          "": Json
        }
        Returns: undefined
      }
      schemas_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      sequences_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      set_adaptive_chunking: {
        Args: {
          hypertable: unknown
          chunk_target_size: string
        }
        Returns: Record<string, unknown>
      }
      set_chunk_time_interval: {
        Args: {
          hypertable: unknown
          chunk_time_interval: unknown
          dimension_name?: unknown
        }
        Returns: undefined
      }
      set_integer_now_func: {
        Args: {
          hypertable: unknown
          integer_now_func: unknown
          replace_if_exists?: boolean
        }
        Returns: undefined
      }
      set_number_partitions: {
        Args: {
          hypertable: unknown
          number_partitions: number
          dimension_name?: unknown
        }
        Returns: undefined
      }
      set_replication_factor: {
        Args: {
          hypertable: unknown
          replication_factor: number
        }
        Returns: undefined
      }
      show_chunks: {
        Args: {
          relation: unknown
          older_than?: unknown
          newer_than?: unknown
        }
        Returns: unknown[]
      }
      show_tablespaces: {
        Args: {
          hypertable: unknown
        }
        Returns: unknown[]
      }
      skip:
        | {
            Args: {
              why: string
              how_many: number
            }
            Returns: string
          }
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": number
            }
            Returns: string
          }
      tables_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      tablespaces_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      teapot: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_add_random_user: {
        Args: {
          collectivite_id: number
          niveau: Database["public"]["Enums"]["niveau_acces"]
          cgu_acceptees?: boolean
        }
        Returns: Record<string, unknown>
      }
      test_attach_user: {
        Args: {
          user_id: string
          collectivite_id: number
          niveau: Database["public"]["Enums"]["niveau_acces"]
        }
        Returns: undefined
      }
      test_changer_acces_restreint_collectivite: {
        Args: {
          collectivite_id: number
          access_restreint: boolean
        }
        Returns: undefined
      }
      test_clear_history: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_create_collectivite: {
        Args: {
          nom: string
        }
        Returns: {
          collectivite_id: number | null
          id: number
          nom: string
        }
      }
      test_create_user: {
        Args: {
          user_id: string
          prenom: string
          nom: string
          email: string
        }
        Returns: undefined
      }
      test_disable_fake_score_generation: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_enable_fake_score_generation: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_fulfill: {
        Args: {
          collectivite_id: number
          etoile: Database["labellisation"]["Enums"]["etoile"]
        }
        Returns: undefined
      }
      test_generate_fake_scores: {
        Args: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          statuts: unknown[]
        }
        Returns: Json
      }
      test_remove_user: {
        Args: {
          email: string
        }
        Returns: undefined
      }
      test_reset: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_reset_action_statut_and_desc: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_reset_audit: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_reset_discussion_et_commentaires: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_reset_droits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_reset_membres: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_reset_plan_action: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_reset_preuves: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_reset_reponse: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_reset_users: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_set_auditeur: {
        Args: {
          demande_id: number
          user_id: string
          audit_en_cours?: boolean
        }
        Returns: {
          audit_id: number
          auditeur: string
          created_at: string | null
        }
      }
      test_set_cot: {
        Args: {
          collectivite_id: number
          actif: boolean
        }
        Returns: {
          actif: boolean
          collectivite_id: number
        }
      }
      test_write_scores: {
        Args: {
          collectivite_id: number
          scores?: unknown[]
        }
        Returns: undefined
      }
      throws_ok: {
        Args: {
          "": string
        }
        Returns: string
      }
      time_bucket:
        | {
            Args: {
              bucket_width: unknown
              ts: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              origin: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              origin: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              origin: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              offset: unknown
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              offset: unknown
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              offset: unknown
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              timezone: string
              origin?: string
              offset?: unknown
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: number
              ts: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
              offset: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
              offset: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
              offset: number
            }
            Returns: number
          }
      time_bucket_gapfill:
        | {
            Args: {
              bucket_width: unknown
              ts: string
              start?: string
              finish?: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: number
              ts: number
              start?: number
              finish?: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
              start?: number
              finish?: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
              start?: number
              finish?: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              start?: string
              finish?: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              start?: string
              finish?: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              timezone: string
              start?: string
              finish?: string
            }
            Returns: string
          }
      timescaledb_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      timescaledb_post_restore: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      timescaledb_pre_restore: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      todo:
        | {
            Args: {
              why: string
              how_many: number
            }
            Returns: boolean[]
          }
        | {
            Args: {
              how_many: number
              why: string
            }
            Returns: boolean[]
          }
        | {
            Args: {
              why: string
            }
            Returns: boolean[]
          }
        | {
            Args: {
              how_many: number
            }
            Returns: boolean[]
          }
      todo_end: {
        Args: Record<PropertyKey, never>
        Returns: boolean[]
      }
      todo_start:
        | {
            Args: {
              "": string
            }
            Returns: boolean[]
          }
        | {
            Args: Record<PropertyKey, never>
            Returns: boolean[]
          }
      types_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      unaccent: {
        Args: {
          "": string
        }
        Returns: string
      }
      unaccent_init: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      update_bibliotheque_fichier_filename: {
        Args: {
          collectivite_id: number
          hash: string
          filename: string
        }
        Returns: undefined
      }
      update_collectivite_membre_champ_intervention: {
        Args: {
          collectivite_id: number
          membre_id: string
          champ_intervention: Database["public"]["Enums"]["referentiel"][]
        }
        Returns: Json
      }
      update_collectivite_membre_details_fonction: {
        Args: {
          collectivite_id: number
          membre_id: string
          details_fonction: string
        }
        Returns: Json
      }
      update_collectivite_membre_fonction: {
        Args: {
          collectivite_id: number
          membre_id: string
          fonction: Database["public"]["Enums"]["membre_fonction"]
        }
        Returns: Json
      }
      update_collectivite_membre_niveau_acces: {
        Args: {
          collectivite_id: number
          membre_id: string
          niveau_acces: Database["public"]["Enums"]["niveau_acces"]
        }
        Returns: Json
      }
      upsert_axe: {
        Args: {
          nom: string
          collectivite_id: number
          parent: number
        }
        Returns: number
      }
      users_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      views_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
    }
    Enums: {
      action_categorie: "bases" | "mise en œuvre" | "effets"
      action_discussion_statut: "ouvert" | "ferme"
      action_type:
        | "referentiel"
        | "axe"
        | "sous-axe"
        | "action"
        | "sous-action"
        | "tache"
      audit_statut: "non_audite" | "en_cours" | "audite"
      avancement:
        | "fait"
        | "pas_fait"
        | "programme"
        | "non_renseigne"
        | "detaille"
      collectivite_filtre_type: "population" | "score" | "remplissage"
      fiche_action_cibles:
        | "Grand public et associations"
        | "Autres collectivités du territoire"
        | "Acteurs économiques"
      fiche_action_niveaux_priorite: "Élevé" | "Moyen" | "Bas"
      fiche_action_piliers_eci:
        | "Approvisionnement durable"
        | "Écoconception"
        | "Écologie industrielle (et territoriale)"
        | "Économie de la fonctionnalité"
        | "Consommation responsable"
        | "Allongement de la durée d’usage"
        | "Recyclage"
      fiche_action_resultats_attendus:
        | "Adaptation au changement climatique"
        | "Allongement de la durée d’usage"
        | "Amélioration de la qualité de vie"
        | "Développement des énergies renouvelables"
        | "Efficacité énergétique"
        | "Préservation de la biodiversité"
        | "Réduction des consommations énergétiques"
        | "Réduction des déchets"
        | "Réduction des émissions de gaz à effet de serre"
        | "Réduction des polluants atmosphériques"
        | "Sobriété énergétique"
      fiche_action_statuts:
        | "À venir"
        | "En cours"
        | "Réalisé"
        | "En pause"
        | "Abandonné"
      filterable_type_collectivite:
        | "commune"
        | "syndicat"
        | "CU"
        | "CC"
        | "POLEM"
        | "METRO"
        | "CA"
        | "EPT"
        | "PETR"
      indicateur_group: "cae" | "crte" | "eci"
      membre_fonction:
        | "referent"
        | "conseiller"
        | "technique"
        | "politique"
        | "partenaire"
      nature:
        | "SMF"
        | "CU"
        | "CC"
        | "SIVOM"
        | "POLEM"
        | "METRO"
        | "SMO"
        | "CA"
        | "EPT"
        | "SIVU"
        | "PETR"
      niveau_acces: "admin" | "edition" | "lecture"
      preuve_type:
        | "complementaire"
        | "reglementaire"
        | "labellisation"
        | "audit"
        | "rapport"
      question_type: "choix" | "binaire" | "proportion"
      referentiel: "eci" | "cae"
      regle_type: "score" | "desactivation" | "reduction"
      role_name: "agent" | "referent" | "conseiller" | "auditeur" | "aucun"
      thematique_completude: "complete" | "a_completer"
      type_collectivite: "EPCI" | "commune" | "syndicat"
      usage_action: "clic" | "vue" | "telechargement" | "saisie" | "selection"
      usage_fonction:
        | "aide"
        | "preuve"
        | "graphique"
        | "decrocher_les_etoiles"
        | "rejoindre_une_collectivite"
        | "collectivite_carte"
        | "pagination"
        | "filtre"
        | "recherche"
        | "filtre_region"
        | "filtre_departement"
        | "filtre_type"
        | "filtre_population"
        | "filtre_referentiel"
        | "filtre_niveau"
        | "filtre_remplissage"
      visite_onglet:
        | "progression"
        | "priorisation"
        | "detail"
        | "suivi"
        | "preuve"
        | "indicateur"
        | "historique"
        | "comparaison"
        | "critere"
      visite_page:
        | "autre"
        | "signin"
        | "signup"
        | "recover"
        | "recover_landing"
        | "mon_compte"
        | "mes_collectivites"
        | "rejoindre"
        | "toutes_collectivites"
        | "tableau_de_bord"
        | "referentiel"
        | "indicateur"
        | "action"
        | "labellisation"
        | "personnalisation"
        | "membre"
        | "bibliotheque"
        | "historique"
        | "plan"
        | "fiche"
        | "plan_axe"
        | "fiches_non_classees"
      visite_tag:
        | "cae"
        | "eci"
        | "crte"
        | "referentiel"
        | "thematique"
        | "personnalise"
    }
    CompositeTypes: {
      financeur_montant: {
        financeur_tag: unknown
        montant_ttc: number
        id: number
      }
      graphique_tranche: {
        id: string
        value: number
      }
      indicateur_generique: {
        indicateur_id: unknown
        indicateur_personnalise_id: number
        nom: string
        description: string
        unite: string
      }
      personne: {
        nom: string
        collectivite_id: number
        tag_id: number
        user_id: string
      }
      plan_action_tableau_de_bord: {
        collectivite_id: number
        plan_id: number
        statuts: unknown
        pilotes: unknown
        referents: unknown
        priorites: unknown
      }
      tabular_score: {
        referentiel: Database["public"]["Enums"]["referentiel"]
        action_id: unknown
        score_realise: number
        score_programme: number
        score_realise_plus_programme: number
        score_pas_fait: number
        score_non_renseigne: number
        points_restants: number
        points_realises: number
        points_programmes: number
        points_max_personnalises: number
        points_max_referentiel: number
        avancement: Database["public"]["Enums"]["avancement"]
        concerne: boolean
        desactive: boolean
      }
    }
  }
}

