export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      abstract_any_indicateur_value: {
        Row: {
          modified_at: string
          valeur: number | null
          annee: number
        }
        Insert: {
          modified_at?: string
          valeur?: number | null
          annee: number
        }
        Update: {
          modified_at?: string
          valeur?: number | null
          annee?: number
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
          collectivite_id: number
          action_id: string
          commentaire: string
          modified_by: string
          modified_at: string
        }
        Insert: {
          collectivite_id: number
          action_id: string
          commentaire: string
          modified_by?: string
          modified_at?: string
        }
        Update: {
          collectivite_id?: number
          action_id?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
        }
      }
      action_computed_points: {
        Row: {
          modified_at: string
          action_id: string
          value: number
        }
        Insert: {
          modified_at?: string
          action_id: string
          value: number
        }
        Update: {
          modified_at?: string
          action_id?: string
          value?: number
        }
      }
      action_definition: {
        Row: {
          modified_at: string
          action_id: string
          referentiel: Database["public"]["Enums"]["referentiel"]
          identifiant: string
          nom: string
          description: string
          contexte: string
          exemples: string
          ressources: string
          reduction_potentiel: string
          perimetre_evaluation: string
          preuve: string | null
          points: number | null
          pourcentage: number | null
          categorie: Database["public"]["Enums"]["action_categorie"] | null
        }
        Insert: {
          modified_at?: string
          action_id: string
          referentiel: Database["public"]["Enums"]["referentiel"]
          identifiant: string
          nom: string
          description: string
          contexte: string
          exemples: string
          ressources: string
          reduction_potentiel: string
          perimetre_evaluation: string
          preuve?: string | null
          points?: number | null
          pourcentage?: number | null
          categorie?: Database["public"]["Enums"]["action_categorie"] | null
        }
        Update: {
          modified_at?: string
          action_id?: string
          referentiel?: Database["public"]["Enums"]["referentiel"]
          identifiant?: string
          nom?: string
          description?: string
          contexte?: string
          exemples?: string
          ressources?: string
          reduction_potentiel?: string
          perimetre_evaluation?: string
          preuve?: string | null
          points?: number | null
          pourcentage?: number | null
          categorie?: Database["public"]["Enums"]["action_categorie"] | null
        }
      }
      action_discussion: {
        Row: {
          id: number
          collectivite_id: number
          action_id: string
          created_by: string
          created_at: string
          modified_at: string
          status: Database["public"]["Enums"]["action_discussion_statut"]
        }
        Insert: {
          id?: number
          collectivite_id: number
          action_id: string
          created_by?: string
          created_at?: string
          modified_at?: string
          status?: Database["public"]["Enums"]["action_discussion_statut"]
        }
        Update: {
          id?: number
          collectivite_id?: number
          action_id?: string
          created_by?: string
          created_at?: string
          modified_at?: string
          status?: Database["public"]["Enums"]["action_discussion_statut"]
        }
      }
      action_discussion_commentaire: {
        Row: {
          id: number
          created_by: string
          created_at: string
          discussion_id: number
          message: string
        }
        Insert: {
          id?: number
          created_by?: string
          created_at?: string
          discussion_id: number
          message: string
        }
        Update: {
          id?: number
          created_by?: string
          created_at?: string
          discussion_id?: number
          message?: string
        }
      }
      action_relation: {
        Row: {
          id: string
          referentiel: Database["public"]["Enums"]["referentiel"]
          parent: string | null
        }
        Insert: {
          id: string
          referentiel: Database["public"]["Enums"]["referentiel"]
          parent?: string | null
        }
        Update: {
          id?: string
          referentiel?: Database["public"]["Enums"]["referentiel"]
          parent?: string | null
        }
      }
      action_statut: {
        Row: {
          collectivite_id: number
          action_id: string
          avancement: Database["public"]["Enums"]["avancement"]
          avancement_detaille: number[] | null
          concerne: boolean
          modified_by: string
          modified_at: string
        }
        Insert: {
          collectivite_id: number
          action_id: string
          avancement: Database["public"]["Enums"]["avancement"]
          avancement_detaille?: number[] | null
          concerne: boolean
          modified_by?: string
          modified_at?: string
        }
        Update: {
          collectivite_id?: number
          action_id?: string
          avancement?: Database["public"]["Enums"]["avancement"]
          avancement_detaille?: number[] | null
          concerne?: boolean
          modified_by?: string
          modified_at?: string
        }
      }
      audit: {
        Row: {
          id: number
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          demande_id: number | null
          date_debut: string
          date_fin: string | null
        }
        Insert: {
          id?: number
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          demande_id?: number | null
          date_debut?: string
          date_fin?: string | null
        }
        Update: {
          id?: number
          collectivite_id?: number
          referentiel?: Database["public"]["Enums"]["referentiel"]
          demande_id?: number | null
          date_debut?: string
          date_fin?: string | null
        }
      }
      audit_auditeur: {
        Row: {
          audit_id: number
          auditeur: string
        }
        Insert: {
          audit_id: number
          auditeur: string
        }
        Update: {
          audit_id?: number
          auditeur?: string
        }
      }
      client_scores: {
        Row: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          scores: Json
          modified_at: string
          payload_timestamp: string | null
        }
        Insert: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          scores: Json
          modified_at: string
          payload_timestamp?: string | null
        }
        Update: {
          collectivite_id?: number
          referentiel?: Database["public"]["Enums"]["referentiel"]
          scores?: Json
          modified_at?: string
          payload_timestamp?: string | null
        }
      }
      client_scores_update: {
        Row: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          modified_at: string
        }
        Insert: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          modified_at: string
        }
        Update: {
          collectivite_id?: number
          referentiel?: Database["public"]["Enums"]["referentiel"]
          modified_at?: string
        }
      }
      collectivite: {
        Row: {
          id: number
          created_at: string
          modified_at: string
        }
        Insert: {
          id?: number
          created_at?: string
          modified_at?: string
        }
        Update: {
          id?: number
          created_at?: string
          modified_at?: string
        }
      }
      collectivite_bucket: {
        Row: {
          collectivite_id: number
          bucket_id: string
        }
        Insert: {
          collectivite_id: number
          bucket_id: string
        }
        Update: {
          collectivite_id?: number
          bucket_id?: string
        }
      }
      collectivite_test: {
        Row: {
          id: number
          collectivite_id: number | null
          nom: string
        }
        Insert: {
          id?: number
          collectivite_id?: number | null
          nom: string
        }
        Update: {
          id?: number
          collectivite_id?: number | null
          nom?: string
        }
      }
      commune: {
        Row: {
          id: number
          collectivite_id: number | null
          nom: string
          code: string
        }
        Insert: {
          id?: number
          collectivite_id?: number | null
          nom: string
          code: string
        }
        Update: {
          id?: number
          collectivite_id?: number | null
          nom?: string
          code?: string
        }
      }
      dcp: {
        Row: {
          user_id: string | null
          nom: string
          prenom: string
          email: string
          limited: boolean
          deleted: boolean
          created_at: string
          modified_at: string
          telephone: string | null
        }
        Insert: {
          user_id?: string | null
          nom: string
          prenom: string
          email: string
          limited?: boolean
          deleted?: boolean
          created_at?: string
          modified_at?: string
          telephone?: string | null
        }
        Update: {
          user_id?: string | null
          nom?: string
          prenom?: string
          email?: string
          limited?: boolean
          deleted?: boolean
          created_at?: string
          modified_at?: string
          telephone?: string | null
        }
      }
      epci: {
        Row: {
          id: number
          collectivite_id: number | null
          nom: string
          siren: string
          nature: Database["public"]["Enums"]["nature"]
        }
        Insert: {
          id?: number
          collectivite_id?: number | null
          nom: string
          siren: string
          nature: Database["public"]["Enums"]["nature"]
        }
        Update: {
          id?: number
          collectivite_id?: number | null
          nom?: string
          siren?: string
          nature?: Database["public"]["Enums"]["nature"]
        }
      }
      fiche_action: {
        Row: {
          modified_at: string
          uid: string
          collectivite_id: number | null
          avancement: Database["public"]["Enums"]["fiche_action_avancement"]
          numerotation: string
          titre: string
          description: string
          structure_pilote: string
          personne_referente: string
          elu_referent: string
          partenaires: string
          budget_global: number
          commentaire: string
          date_fin: string
          date_debut: string
          en_retard: boolean
          action_ids: unknown[]
          indicateur_ids: unknown[]
          indicateur_personnalise_ids: number[]
        }
        Insert: {
          modified_at?: string
          uid: string
          collectivite_id?: number | null
          avancement: Database["public"]["Enums"]["fiche_action_avancement"]
          numerotation: string
          titre: string
          description: string
          structure_pilote: string
          personne_referente: string
          elu_referent: string
          partenaires: string
          budget_global: number
          commentaire: string
          date_fin: string
          date_debut: string
          en_retard: boolean
          action_ids: unknown[]
          indicateur_ids: unknown[]
          indicateur_personnalise_ids: number[]
        }
        Update: {
          modified_at?: string
          uid?: string
          collectivite_id?: number | null
          avancement?: Database["public"]["Enums"]["fiche_action_avancement"]
          numerotation?: string
          titre?: string
          description?: string
          structure_pilote?: string
          personne_referente?: string
          elu_referent?: string
          partenaires?: string
          budget_global?: number
          commentaire?: string
          date_fin?: string
          date_debut?: string
          en_retard?: boolean
          action_ids?: unknown[]
          indicateur_ids?: unknown[]
          indicateur_personnalise_ids?: number[]
        }
      }
      fiche_action_action: {
        Row: {
          fiche_action_uid: string
          action_id: string
        }
        Insert: {
          fiche_action_uid: string
          action_id: string
        }
        Update: {
          fiche_action_uid?: string
          action_id?: string
        }
      }
      fiche_action_indicateur: {
        Row: {
          fiche_action_uid: string
          indicateur_id: string
        }
        Insert: {
          fiche_action_uid: string
          indicateur_id: string
        }
        Update: {
          fiche_action_uid?: string
          indicateur_id?: string
        }
      }
      fiche_action_indicateur_personnalise: {
        Row: {
          fiche_action_uid: string
          indicateur_personnalise_id: number
        }
        Insert: {
          fiche_action_uid: string
          indicateur_personnalise_id: number
        }
        Update: {
          fiche_action_uid?: string
          indicateur_personnalise_id?: number
        }
      }
      filtre_intervalle: {
        Row: {
          type: Database["public"]["Enums"]["collectivite_filtre_type"]
          id: string
          libelle: string
          intervalle: unknown
        }
        Insert: {
          type: Database["public"]["Enums"]["collectivite_filtre_type"]
          id: string
          libelle: string
          intervalle: unknown
        }
        Update: {
          type?: Database["public"]["Enums"]["collectivite_filtre_type"]
          id?: string
          libelle?: string
          intervalle?: unknown
        }
      }
      indicateur_action: {
        Row: {
          modified_at: string
          indicateur_id: string
          action_id: string
        }
        Insert: {
          modified_at?: string
          indicateur_id: string
          action_id: string
        }
        Update: {
          modified_at?: string
          indicateur_id?: string
          action_id?: string
        }
      }
      indicateur_commentaire: {
        Row: {
          modified_at: string
          collectivite_id: number
          indicateur_id: string
          commentaire: string
          modified_by: string
        }
        Insert: {
          modified_at?: string
          collectivite_id: number
          indicateur_id: string
          commentaire: string
          modified_by?: string
        }
        Update: {
          modified_at?: string
          collectivite_id?: number
          indicateur_id?: string
          commentaire?: string
          modified_by?: string
        }
      }
      indicateur_definition: {
        Row: {
          modified_at: string
          id: string
          indicateur_group: Database["public"]["Enums"]["indicateur_group"]
          identifiant: string
          valeur_indicateur: string | null
          nom: string
          description: string
          unite: string
          obligation_eci: boolean
          parent: number | null
        }
        Insert: {
          modified_at?: string
          id: string
          indicateur_group: Database["public"]["Enums"]["indicateur_group"]
          identifiant: string
          valeur_indicateur?: string | null
          nom: string
          description: string
          unite: string
          obligation_eci: boolean
          parent?: number | null
        }
        Update: {
          modified_at?: string
          id?: string
          indicateur_group?: Database["public"]["Enums"]["indicateur_group"]
          identifiant?: string
          valeur_indicateur?: string | null
          nom?: string
          description?: string
          unite?: string
          obligation_eci?: boolean
          parent?: number | null
        }
      }
      indicateur_objectif: {
        Row: {
          modified_at: string
          valeur: number | null
          annee: number
          collectivite_id: number
          indicateur_id: string
        }
        Insert: {
          modified_at?: string
          valeur?: number | null
          annee: number
          collectivite_id: number
          indicateur_id: string
        }
        Update: {
          modified_at?: string
          valeur?: number | null
          annee?: number
          collectivite_id?: number
          indicateur_id?: string
        }
      }
      indicateur_parent: {
        Row: {
          id: number
          numero: string
          nom: string
        }
        Insert: {
          id?: number
          numero: string
          nom: string
        }
        Update: {
          id?: number
          numero?: string
          nom?: string
        }
      }
      indicateur_personnalise_definition: {
        Row: {
          modified_at: string
          id: number
          collectivite_id: number | null
          titre: string
          description: string
          unite: string
          commentaire: string
          modified_by: string
        }
        Insert: {
          modified_at?: string
          id?: number
          collectivite_id?: number | null
          titre: string
          description: string
          unite: string
          commentaire: string
          modified_by?: string
        }
        Update: {
          modified_at?: string
          id?: number
          collectivite_id?: number | null
          titre?: string
          description?: string
          unite?: string
          commentaire?: string
          modified_by?: string
        }
      }
      indicateur_personnalise_objectif: {
        Row: {
          modified_at: string
          valeur: number | null
          annee: number
          collectivite_id: number
          indicateur_id: number
        }
        Insert: {
          modified_at?: string
          valeur?: number | null
          annee: number
          collectivite_id: number
          indicateur_id: number
        }
        Update: {
          modified_at?: string
          valeur?: number | null
          annee?: number
          collectivite_id?: number
          indicateur_id?: number
        }
      }
      indicateur_personnalise_resultat: {
        Row: {
          modified_at: string
          valeur: number | null
          annee: number
          collectivite_id: number
          indicateur_id: number
        }
        Insert: {
          modified_at?: string
          valeur?: number | null
          annee: number
          collectivite_id: number
          indicateur_id: number
        }
        Update: {
          modified_at?: string
          valeur?: number | null
          annee?: number
          collectivite_id?: number
          indicateur_id?: number
        }
      }
      indicateur_resultat: {
        Row: {
          modified_at: string
          valeur: number | null
          annee: number
          collectivite_id: number
          indicateur_id: string
        }
        Insert: {
          modified_at?: string
          valeur?: number | null
          annee: number
          collectivite_id: number
          indicateur_id: string
        }
        Update: {
          modified_at?: string
          valeur?: number | null
          annee?: number
          collectivite_id?: number
          indicateur_id?: string
        }
      }
      indicateurs_json: {
        Row: {
          indicateurs: Json
          created_at: string
        }
        Insert: {
          indicateurs: Json
          created_at?: string
        }
        Update: {
          indicateurs?: Json
          created_at?: string
        }
      }
      labellisation: {
        Row: {
          id: number
          collectivite_id: number | null
          referentiel: Database["public"]["Enums"]["referentiel"]
          obtenue_le: string
          annee: number | null
          etoiles: number
          score_realise: number | null
          score_programme: number | null
        }
        Insert: {
          id?: number
          collectivite_id?: number | null
          referentiel: Database["public"]["Enums"]["referentiel"]
          obtenue_le: string
          annee?: number | null
          etoiles: number
          score_realise?: number | null
          score_programme?: number | null
        }
        Update: {
          id?: number
          collectivite_id?: number | null
          referentiel?: Database["public"]["Enums"]["referentiel"]
          obtenue_le?: string
          annee?: number | null
          etoiles?: number
          score_realise?: number | null
          score_programme?: number | null
        }
      }
      labellisation_action_critere: {
        Row: {
          etoile: "1" | "2" | "3" | "4" | "5"
          prio: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          action_id: string
          formulation: string
          min_realise_percentage: number | null
          min_programme_percentage: number | null
          min_realise_score: number | null
          min_programme_score: number | null
        }
        Insert: {
          etoile: "1" | "2" | "3" | "4" | "5"
          prio: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          action_id: string
          formulation: string
          min_realise_percentage?: number | null
          min_programme_percentage?: number | null
          min_realise_score?: number | null
          min_programme_score?: number | null
        }
        Update: {
          etoile?: "1" | "2" | "3" | "4" | "5"
          prio?: number
          referentiel?: Database["public"]["Enums"]["referentiel"]
          action_id?: string
          formulation?: string
          min_realise_percentage?: number | null
          min_programme_percentage?: number | null
          min_realise_score?: number | null
          min_programme_score?: number | null
        }
      }
      labellisation_calendrier: {
        Row: {
          referentiel: Database["public"]["Enums"]["referentiel"]
          information: string
        }
        Insert: {
          referentiel: Database["public"]["Enums"]["referentiel"]
          information: string
        }
        Update: {
          referentiel?: Database["public"]["Enums"]["referentiel"]
          information?: string
        }
      }
      labellisation_fichier_critere: {
        Row: {
          referentiel: Database["public"]["Enums"]["referentiel"]
          etoile: "1" | "2" | "3" | "4" | "5"
          description: string
        }
        Insert: {
          referentiel: Database["public"]["Enums"]["referentiel"]
          etoile: "1" | "2" | "3" | "4" | "5"
          description: string
        }
        Update: {
          referentiel?: Database["public"]["Enums"]["referentiel"]
          etoile?: "1" | "2" | "3" | "4" | "5"
          description?: string
        }
      }
      maintenance: {
        Row: {
          id: number
          begins_at: string
          ends_at: string
        }
        Insert: {
          id?: number
          begins_at: string
          ends_at: string
        }
        Update: {
          id?: number
          begins_at?: string
          ends_at?: string
        }
      }
      personnalisation: {
        Row: {
          action_id: string
          titre: string
          description: string
        }
        Insert: {
          action_id: string
          titre: string
          description: string
        }
        Update: {
          action_id?: string
          titre?: string
          description?: string
        }
      }
      personnalisation_consequence: {
        Row: {
          modified_at: string
          collectivite_id: number
          consequences: Json
          payload_timestamp: string | null
        }
        Insert: {
          modified_at?: string
          collectivite_id: number
          consequences: Json
          payload_timestamp?: string | null
        }
        Update: {
          modified_at?: string
          collectivite_id?: number
          consequences?: Json
          payload_timestamp?: string | null
        }
      }
      personnalisation_regle: {
        Row: {
          action_id: string
          type: Database["public"]["Enums"]["regle_type"]
          formule: string
          description: string
          modified_at: string
        }
        Insert: {
          action_id: string
          type: Database["public"]["Enums"]["regle_type"]
          formule: string
          description: string
          modified_at?: string
        }
        Update: {
          action_id?: string
          type?: Database["public"]["Enums"]["regle_type"]
          formule?: string
          description?: string
          modified_at?: string
        }
      }
      personnalisations_json: {
        Row: {
          questions: Json
          regles: Json
          created_at: string
        }
        Insert: {
          questions: Json
          regles: Json
          created_at?: string
        }
        Update: {
          questions?: Json
          regles?: Json
          created_at?: string
        }
      }
      plan_action: {
        Row: {
          uid: string
          collectivite_id: number | null
          nom: string
          categories: Json
          fiches_by_category: Json
          created_at: string
          modified_at: string
        }
        Insert: {
          uid: string
          collectivite_id?: number | null
          nom: string
          categories: Json
          fiches_by_category: Json
          created_at?: string
          modified_at?: string
        }
        Update: {
          uid?: string
          collectivite_id?: number | null
          nom?: string
          categories?: Json
          fiches_by_category?: Json
          created_at?: string
          modified_at?: string
        }
      }
      pre_audit_scores: {
        Row: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          scores: Json
          modified_at: string
          payload_timestamp: string | null
          audit_id: number
        }
        Insert: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          scores: Json
          modified_at: string
          payload_timestamp?: string | null
          audit_id: number
        }
        Update: {
          collectivite_id?: number
          referentiel?: Database["public"]["Enums"]["referentiel"]
          scores?: Json
          modified_at?: string
          payload_timestamp?: string | null
          audit_id?: number
        }
      }
      preuve_action: {
        Row: {
          preuve_id: string
          action_id: string
        }
        Insert: {
          preuve_id: string
          action_id: string
        }
        Update: {
          preuve_id?: string
          action_id?: string
        }
      }
      preuve_complementaire: {
        Row: {
          id: number
          collectivite_id: number
          fichier_id: number | null
          url: string | null
          titre: string
          commentaire: string
          modified_by: string
          modified_at: string
          lien: Json | null
          action_id: string
        }
        Insert: {
          id?: number
          collectivite_id: number
          fichier_id?: number | null
          url?: string | null
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
          action_id: string
        }
        Update: {
          id?: number
          collectivite_id?: number
          fichier_id?: number | null
          url?: string | null
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
          action_id?: string
        }
      }
      preuve_labellisation: {
        Row: {
          id: number
          collectivite_id: number
          fichier_id: number | null
          url: string | null
          titre: string
          commentaire: string
          modified_by: string
          modified_at: string
          lien: Json | null
          demande_id: number
        }
        Insert: {
          id?: number
          collectivite_id: number
          fichier_id?: number | null
          url?: string | null
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
          demande_id: number
        }
        Update: {
          id?: number
          collectivite_id?: number
          fichier_id?: number | null
          url?: string | null
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
          demande_id?: number
        }
      }
      preuve_rapport: {
        Row: {
          id: number
          collectivite_id: number
          fichier_id: number | null
          url: string | null
          titre: string
          commentaire: string
          modified_by: string
          modified_at: string
          lien: Json | null
          date: string
        }
        Insert: {
          id?: number
          collectivite_id: number
          fichier_id?: number | null
          url?: string | null
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
          date: string
        }
        Update: {
          id?: number
          collectivite_id?: number
          fichier_id?: number | null
          url?: string | null
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
          date?: string
        }
      }
      preuve_reglementaire: {
        Row: {
          id: number
          collectivite_id: number
          fichier_id: number | null
          url: string | null
          titre: string
          commentaire: string
          modified_by: string
          modified_at: string
          lien: Json | null
          preuve_id: string
        }
        Insert: {
          id?: number
          collectivite_id: number
          fichier_id?: number | null
          url?: string | null
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
          preuve_id: string
        }
        Update: {
          id?: number
          collectivite_id?: number
          fichier_id?: number | null
          url?: string | null
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
          preuve_id?: string
        }
      }
      preuve_reglementaire_definition: {
        Row: {
          id: string
          nom: string
          description: string
        }
        Insert: {
          id: string
          nom: string
          description: string
        }
        Update: {
          id?: string
          nom?: string
          description?: string
        }
      }
      preuve_reglementaire_json: {
        Row: {
          preuves: Json
          created_at: string
        }
        Insert: {
          preuves: Json
          created_at?: string
        }
        Update: {
          preuves?: Json
          created_at?: string
        }
      }
      private_collectivite_membre: {
        Row: {
          user_id: string
          collectivite_id: number
          fonction: Database["public"]["Enums"]["membre_fonction"] | null
          details_fonction: string | null
          champ_intervention:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          created_at: string
          modified_at: string
        }
        Insert: {
          user_id: string
          collectivite_id: number
          fonction?: Database["public"]["Enums"]["membre_fonction"] | null
          details_fonction?: string | null
          champ_intervention?:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          created_at?: string
          modified_at?: string
        }
        Update: {
          user_id?: string
          collectivite_id?: number
          fonction?: Database["public"]["Enums"]["membre_fonction"] | null
          details_fonction?: string | null
          champ_intervention?:
            | Database["public"]["Enums"]["referentiel"][]
            | null
          created_at?: string
          modified_at?: string
        }
      }
      private_utilisateur_droit: {
        Row: {
          id: number
          user_id: string
          collectivite_id: number
          active: boolean
          created_at: string
          modified_at: string
          niveau_acces: Database["public"]["Enums"]["niveau_acces"]
          invitation_id: string | null
        }
        Insert: {
          id?: number
          user_id: string
          collectivite_id: number
          active: boolean
          created_at?: string
          modified_at?: string
          niveau_acces?: Database["public"]["Enums"]["niveau_acces"]
          invitation_id?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          collectivite_id?: number
          active?: boolean
          created_at?: string
          modified_at?: string
          niveau_acces?: Database["public"]["Enums"]["niveau_acces"]
          invitation_id?: string | null
        }
      }
      question: {
        Row: {
          id: string
          thematique_id: string | null
          ordonnancement: number | null
          types_collectivites_concernees:
            | Database["public"]["Enums"]["type_collectivite"][]
            | null
          type: Database["public"]["Enums"]["question_type"]
          description: string
          formulation: string
        }
        Insert: {
          id: string
          thematique_id?: string | null
          ordonnancement?: number | null
          types_collectivites_concernees?:
            | Database["public"]["Enums"]["type_collectivite"][]
            | null
          type: Database["public"]["Enums"]["question_type"]
          description: string
          formulation: string
        }
        Update: {
          id?: string
          thematique_id?: string | null
          ordonnancement?: number | null
          types_collectivites_concernees?:
            | Database["public"]["Enums"]["type_collectivite"][]
            | null
          type?: Database["public"]["Enums"]["question_type"]
          description?: string
          formulation?: string
        }
      }
      question_action: {
        Row: {
          question_id: string
          action_id: string
        }
        Insert: {
          question_id: string
          action_id: string
        }
        Update: {
          question_id?: string
          action_id?: string
        }
      }
      question_choix: {
        Row: {
          question_id: string | null
          id: string
          ordonnancement: number | null
          formulation: string | null
        }
        Insert: {
          question_id?: string | null
          id: string
          ordonnancement?: number | null
          formulation?: string | null
        }
        Update: {
          question_id?: string | null
          id?: string
          ordonnancement?: number | null
          formulation?: string | null
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
          definitions: Json
          children: Json
          created_at: string
        }
        Insert: {
          definitions: Json
          children: Json
          created_at?: string
        }
        Update: {
          definitions?: Json
          children?: Json
          created_at?: string
        }
      }
      reponse_binaire: {
        Row: {
          modified_at: string
          collectivite_id: number
          question_id: string
          reponse: boolean | null
        }
        Insert: {
          modified_at?: string
          collectivite_id: number
          question_id: string
          reponse?: boolean | null
        }
        Update: {
          modified_at?: string
          collectivite_id?: number
          question_id?: string
          reponse?: boolean | null
        }
      }
      reponse_choix: {
        Row: {
          modified_at: string
          collectivite_id: number
          question_id: string
          reponse: string | null
        }
        Insert: {
          modified_at?: string
          collectivite_id: number
          question_id: string
          reponse?: string | null
        }
        Update: {
          modified_at?: string
          collectivite_id?: number
          question_id?: string
          reponse?: string | null
        }
      }
      reponse_proportion: {
        Row: {
          modified_at: string
          collectivite_id: number
          question_id: string
          reponse: number | null
        }
        Insert: {
          modified_at?: string
          collectivite_id: number
          question_id: string
          reponse?: number | null
        }
        Update: {
          modified_at?: string
          collectivite_id?: number
          question_id?: string
          reponse?: number | null
        }
      }
      type_tabular_score: {
        Row: {
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          action_id: string | null
          score_realise: number | null
          score_programme: number | null
          score_realise_plus_programme: number | null
          score_pas_fait: number | null
          score_non_renseigne: number | null
          points_restants: number | null
          points_realises: number | null
          points_programmes: number | null
          points_max_personnalises: number | null
          points_max_referentiel: number | null
        }
        Insert: {
          referentiel?: Database["public"]["Enums"]["referentiel"] | null
          action_id?: string | null
          score_realise?: number | null
          score_programme?: number | null
          score_realise_plus_programme?: number | null
          score_pas_fait?: number | null
          score_non_renseigne?: number | null
          points_restants?: number | null
          points_realises?: number | null
          points_programmes?: number | null
          points_max_personnalises?: number | null
          points_max_referentiel?: number | null
        }
        Update: {
          referentiel?: Database["public"]["Enums"]["referentiel"] | null
          action_id?: string | null
          score_realise?: number | null
          score_programme?: number | null
          score_realise_plus_programme?: number | null
          score_pas_fait?: number | null
          score_non_renseigne?: number | null
          points_restants?: number | null
          points_realises?: number | null
          points_programmes?: number | null
          points_max_personnalises?: number | null
          points_max_referentiel?: number | null
        }
      }
    }
    Views: {
      action_audit_state: {
        Row: {
          action_id: string | null
          state_id: number | null
          statut: Database["public"]["Enums"]["audit_statut"] | null
          avis: string | null
          ordre_du_jour: boolean | null
          audit_id: number | null
          collectivite_id: number | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
        }
      }
      action_children: {
        Row: {
          id: string | null
          children: unknown[] | null
          depth: number | null
        }
      }
      action_definition_summary: {
        Row: {
          id: string | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          children: unknown[] | null
          depth: number | null
          type: Database["public"]["Enums"]["action_type"] | null
          identifiant: string | null
          nom: string | null
          description: string | null
          have_exemples: boolean | null
          have_preuve: boolean | null
          have_ressources: boolean | null
          have_reduction_potentiel: boolean | null
          have_perimetre_evaluation: boolean | null
          have_contexte: boolean | null
          have_questions: boolean | null
        }
      }
      action_discussion_feed: {
        Row: {
          id: number | null
          collectivite_id: number | null
          action_id: string | null
          created_by: string | null
          created_at: string | null
          modified_at: string | null
          status: Database["public"]["Enums"]["action_discussion_statut"] | null
          commentaires: Json[] | null
        }
      }
      action_title: {
        Row: {
          id: string | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          children: unknown[] | null
          type: Database["public"]["Enums"]["action_type"] | null
          identifiant: string | null
          nom: string | null
        }
      }
      active_collectivite: {
        Row: {
          collectivite_id: number | null
          nom: string | null
        }
      }
      bibliotheque_fichier: {
        Row: {
          id: number | null
          collectivite_id: number | null
          hash: string | null
          filename: string | null
          bucket_id: string | null
          file_id: string | null
          filesize: number | null
        }
      }
      business_action_children: {
        Row: {
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          id: string | null
          parent: string | null
          children: unknown[] | null
        }
      }
      business_action_statut: {
        Row: {
          collectivite_id: number | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          action_id: string | null
          avancement: Database["public"]["Enums"]["avancement"] | null
          avancement_detaille: number[] | null
          concerne: boolean | null
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
          collectivite_id: number | null
          modified_by: string | null
          action_id: string | null
          avancement: Database["public"]["Enums"]["avancement"] | null
          concerne: boolean | null
        }
        Insert: {
          collectivite_id?: number | null
          modified_by?: string | null
          action_id?: string | null
          avancement?: Database["public"]["Enums"]["avancement"] | null
          concerne?: boolean | null
        }
        Update: {
          collectivite_id?: number | null
          modified_by?: string | null
          action_id?: string | null
          avancement?: Database["public"]["Enums"]["avancement"] | null
          concerne?: boolean | null
        }
      }
      collectivite_carte_identite: {
        Row: {
          collectivite_id: number | null
          nom: string | null
          type_collectivite:
            | Database["public"]["Enums"]["type_collectivite"]
            | null
          code_siren_insee: string | null
          region_name: string | null
          departement_name: string | null
          population_source: string | null
          population_totale: number | null
        }
      }
      collectivite_identite: {
        Row: {
          id: number | null
          population: string[] | null
          type: Database["public"]["Enums"]["type_collectivite"][] | null
          localisation: string[] | null
        }
      }
      collectivite_niveau_acces: {
        Row: {
          collectivite_id: number | null
          nom: string | null
          niveau_acces: Database["public"]["Enums"]["niveau_acces"] | null
          est_auditeur: boolean | null
        }
      }
      comparaison_scores_audit: {
        Row: {
          collectivite_id: number | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          action_id: string | null
          courant: unknown | null
          pre_audit: unknown | null
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
      historique: {
        Row: {
          type: string | null
          collectivite_id: number | null
          modified_by_id: string | null
          previous_modified_by_id: string | null
          modified_at: string | null
          previous_modified_at: string | null
          action_id: string | null
          avancement: Database["public"]["Enums"]["avancement"] | null
          previous_avancement: Database["public"]["Enums"]["avancement"] | null
          avancement_detaille: number[] | null
          previous_avancement_detaille: number[] | null
          concerne: boolean | null
          previous_concerne: boolean | null
          precision: string | null
          previous_precision: string | null
          question_id: string | null
          question_type: Database["public"]["Enums"]["question_type"] | null
          reponse: Json | null
          previous_reponse: Json | null
          modified_by_nom: string | null
          tache_identifiant: string | null
          tache_nom: string | null
          action_identifiant: string | null
          action_nom: string | null
          question_formulation: string | null
          thematique_id: string | null
          thematique_nom: string | null
          action_ids: unknown[] | null
        }
      }
      mes_collectivites: {
        Row: {
          collectivite_id: number | null
          nom: string | null
          niveau_acces: Database["public"]["Enums"]["niveau_acces"] | null
          est_auditeur: boolean | null
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
          now: string | null
          begins_at: string | null
          ends_at: string | null
        }
      }
      preuve: {
        Row: {
          preuve_type: Database["public"]["Enums"]["preuve_type"] | null
          id: number | null
          collectivite_id: number | null
          fichier: Json | null
          lien: Json | null
          commentaire: string | null
          created_at: string | null
          created_by: string | null
          created_by_nom: string | null
          action: Json | null
          preuve_reglementaire: Json | null
          demande: Json | null
          rapport: Json | null
        }
      }
      question_display: {
        Row: {
          id: string | null
          action_ids: unknown[] | null
          collectivite_id: number | null
          thematique_id: string | null
          type: Database["public"]["Enums"]["question_type"] | null
          thematique_nom: string | null
          description: string | null
          types_collectivites_concernees:
            | Database["public"]["Enums"]["type_collectivite"][]
            | null
          formulation: string | null
          ordonnancement: number | null
          choix: Json[] | null
          population: string[] | null
          localisation: string[] | null
        }
      }
      question_engine: {
        Row: {
          id: string | null
          type: Database["public"]["Enums"]["question_type"] | null
          choix_ids: unknown[] | null
        }
      }
      question_thematique_completude: {
        Row: {
          collectivite_id: number | null
          id: string | null
          nom: string | null
          referentiels: Database["public"]["Enums"]["referentiel"][] | null
          completude:
            | Database["public"]["Enums"]["thematique_completude"]
            | null
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
          question_id: string | null
          collectivite_id: number | null
          reponse: Json | null
        }
      }
      retool_active_collectivite: {
        Row: {
          collectivite_id: number | null
          nom: string | null
        }
      }
      retool_completude: {
        Row: {
          collectivite_id: number | null
          nom: string | null
          region_name: string | null
          departement_name: string | null
          type_collectivite:
            | Database["public"]["Enums"]["type_collectivite"]
            | null
          population_totale: number | null
          code_siren_insee: string | null
          completude_eci: number | null
          completude_cae: number | null
        }
      }
      retool_completude_compute: {
        Row: {
          collectivite_id: number | null
          nom: string | null
          completude_eci: number | null
          completude_cae: number | null
        }
      }
      retool_labellisation: {
        Row: {
          id: number | null
          collectivite_id: number | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          obtenue_le: string | null
          annee: number | null
          etoiles: number | null
          score_realise: number | null
          score_programme: number | null
          collectivite_nom: string | null
        }
      }
      retool_labellisation_demande: {
        Row: {
          id: number | null
          en_cours: boolean | null
          collectivite_id: number | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          etoiles: "1" | "2" | "3" | "4" | "5" | null
          date: string | null
          nom: string | null
        }
      }
      retool_last_activity: {
        Row: {
          collectivite_id: number | null
          nom: string | null
          statut: string | null
          commentaire: string | null
          plan_action: string | null
          fiche_action: string | null
          indicateur: string | null
          indicateur_commentaire: string | null
          indicateur_perso: string | null
          indicateur_perso_resultat: string | null
        }
      }
      retool_preuves: {
        Row: {
          collectivite_id: number | null
          nom: string | null
          referentiel: string | null
          action: string | null
          preuve_type: Database["public"]["Enums"]["preuve_type"] | null
          fichier: string | null
          lien: string | null
          created_at: string | null
        }
      }
      retool_score: {
        Row: {
          collectivite_id: number | null
          Collectivité: string | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          Identifiant: string | null
          Titre: string | null
          "Points potentiels": number | null
          "Points realisés": number | null
          "Pourcentage réalisé": number | null
          "Points programmés": number | null
          "Pourcentage programmé": number | null
          "Pourcentage non renseigné": number | null
          Avancement: string | null
          "Commentaires fusionnés": string | null
          Commentaire: string | null
          "Modifié le": string | null
        }
      }
      retool_user_collectivites_list: {
        Row: {
          prenom: string | null
          nom: string | null
          email: string | null
          creation: string | null
          derniere_connexion: string | null
          collectivites: string[] | null
          nb_collectivite: number | null
        }
      }
      retool_user_list: {
        Row: {
          droit_id: number | null
          collectivite_id: number | null
          user_id: string | null
          collectivite: string | null
          niveau_acces: Database["public"]["Enums"]["niveau_acces"] | null
          active: boolean | null
          prenom: string | null
          nom: string | null
          email: string | null
          telephone: string | null
          fonction: Database["public"]["Enums"]["membre_fonction"] | null
          details_fonction: string | null
          champ_intervention:
            | Database["public"]["Enums"]["referentiel"][]
            | null
        }
      }
      stats_active_real_collectivites: {
        Row: {
          collectivite_id: number | null
          nom: string | null
        }
      }
      stats_functionnalities_usage_proportion: {
        Row: {
          fiche_action_avg: number | null
          cae_statuses_avg: number | null
          eci_statuses_avg: number | null
          indicateur_referentiel_avg: number | null
          indicateur_personnalise_avg: number | null
        }
      }
      suivi_audit: {
        Row: {
          collectivite_id: number | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          action_id: string | null
          have_children: boolean | null
          type: Database["public"]["Enums"]["action_type"] | null
          statut: Database["public"]["Enums"]["audit_statut"] | null
          statuts: Database["public"]["Enums"]["audit_statut"][] | null
          avis: string | null
          ordre_du_jour: boolean | null
          ordres_du_jour: boolean[] | null
        }
      }
    }
    Functions: {
      action_contexte: {
        Args: { id: unknown }
        Returns: Record<string, unknown>[]
      }
      action_down_to_tache: {
        Args: {
          referentiel: Database["public"]["Enums"]["referentiel"]
          identifiant: string
        }
        Returns: unknown
      }
      action_exemples: {
        Args: { id: unknown }
        Returns: Record<string, unknown>[]
      }
      action_perimetre_evaluation: {
        Args: { id: unknown }
        Returns: Record<string, unknown>[]
      }
      action_preuve: {
        Args: { id: unknown }
        Returns: Record<string, unknown>[]
      }
      action_reduction_potentiel: {
        Args: { id: unknown }
        Returns: Record<string, unknown>[]
      }
      action_ressources: {
        Args: { id: unknown }
        Returns: Record<string, unknown>[]
      }
      add_bibliotheque_fichier: {
        Args: { collectivite_id: number; hash: string; filename: string }
        Returns: unknown
      }
      add_user: {
        Args: {
          collectivite_id: number
          email: string
          niveau: Database["public"]["Enums"]["niveau_acces"]
        }
        Returns: Json
      }
      business_insert_actions: {
        Args: {
          relations: unknown
          definitions: unknown
          computed_points: unknown
        }
        Returns: undefined
      }
      business_update_actions: {
        Args: { definitions: unknown; computed_points: unknown }
        Returns: undefined
      }
      business_upsert_indicateurs: {
        Args: { indicateur_definitions: unknown; indicateur_actions: unknown }
        Returns: undefined
      }
      claim_collectivite: {
        Args: { id: number }
        Returns: Json
      }
      collectivite_membres: {
        Args: { id: number }
        Returns: Record<string, unknown>[]
      }
      consume_invitation: {
        Args: { id: string }
        Returns: undefined
      }
      est_auditeur: {
        Args: { col: number }
        Returns: boolean
      }
      gbt_bit_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      have_admin_acces: {
        Args: { id: number }
        Returns: boolean
      }
      have_discussion_edition_acces: {
        Args: { id: number }
        Returns: boolean
      }
      have_discussion_lecture_acces: {
        Args: { id: number }
        Returns: boolean
      }
      have_edition_acces: {
        Args: { id: number }
        Returns: boolean
      }
      have_lecture_acces: {
        Args: { id: number }
        Returns: boolean
      }
      have_one_of_niveaux_acces: {
        Args: { niveaux: unknown; id: number }
        Returns: boolean
      }
      is_agent_of: {
        Args: { id: number }
        Returns: boolean
      }
      is_any_role_on: {
        Args: { id: number }
        Returns: boolean
      }
      is_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_bucket_writer: {
        Args: { id: string }
        Returns: boolean
      }
      is_referent_of: {
        Args: { id: number }
        Returns: boolean
      }
      is_service_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      labellisation_demande: {
        Args: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          etoiles: "1" | "2" | "3" | "4" | "5"
        }
        Returns: unknown
      }
      labellisation_parcours: {
        Args: { collectivite_id: number }
        Returns: Record<string, unknown>[]
      }
      labellisation_submit_demande: {
        Args: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          etoiles: "1" | "2" | "3" | "4" | "5"
        }
        Returns: unknown
      }
      naturalsort: {
        Args: { "": string }
        Returns: string
      }
      quit_collectivite: {
        Args: { id: number }
        Returns: Json
      }
      referent_contact: {
        Args: { id: number }
        Returns: Json
      }
      referent_contacts: {
        Args: { id: number }
        Returns: Record<string, unknown>[]
      }
      referentiel_down_to_action: {
        Args: { referentiel: Database["public"]["Enums"]["referentiel"] }
        Returns: unknown
      }
      remove_membre_from_collectivite: {
        Args: { collectivite_id: number; email: string }
        Returns: Json
      }
      retool_user_list: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, unknown>[]
      }
      save_reponse: {
        Args: { "": Json }
        Returns: undefined
      }
      teapot: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_add_random_user: {
        Args: {
          collectivite_id: number
          niveau: Database["public"]["Enums"]["niveau_acces"]
        }
        Returns: Record<string, unknown>[]
      }
      test_attach_user: {
        Args: {
          user_id: string
          collectivite_id: number
          niveau: Database["public"]["Enums"]["niveau_acces"]
        }
        Returns: undefined
      }
      test_clear_history: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_create_user: {
        Args: { user_id: string; prenom: string; nom: string; email: string }
        Returns: undefined
      }
      test_fulfill: {
        Args: { collectivite_id: number; etoile: "1" | "2" | "3" | "4" | "5" }
        Returns: undefined
      }
      test_remove_user: {
        Args: { email: string }
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
      test_write_scores: {
        Args: { collectivite_id: number; scores: unknown }
        Returns: undefined
      }
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
      }
      update_collectivite_membre_champ_intervention: {
        Args: {
          collectivite_id: number
          membre_id: string
          champ_intervention: unknown
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
      update_fiche_relationships: {
        Args: {
          fiche_action_uid: string
          action_ids: unknown
          indicateur_ids: unknown
          indicateur_personnalise_ids: unknown
        }
        Returns: undefined
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
      fiche_action_avancement:
        | "pas_fait"
        | "fait"
        | "en_cours"
        | "non_renseigne"
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
        | "rapport"
      question_type: "choix" | "binaire" | "proportion"
      referentiel: "eci" | "cae"
      regle_type: "score" | "desactivation" | "reduction"
      role_name: "agent" | "referent" | "conseiller" | "auditeur" | "aucun"
      thematique_completude: "complete" | "a_completer"
      type_collectivite: "EPCI" | "commune" | "syndicat"
    }
  }
}

