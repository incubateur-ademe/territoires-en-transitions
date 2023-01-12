export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Enums: {
      action_categorie: "bases" | "mise en œuvre" | "effets";
      action_discussion_statut: "ouvert" | "ferme";
      action_type:
        | "referentiel"
        | "axe"
        | "sous-axe"
        | "action"
        | "sous-action"
        | "tache";
      audit_statut: "non_audite" | "en_cours" | "audite";
      avancement:
        | "fait"
        | "pas_fait"
        | "programme"
        | "non_renseigne"
        | "detaille";
      collectivite_filtre_type: "population" | "score" | "remplissage";
      fiche_action_cibles:
        | "Grand public et associations"
        | "Autres collectivités du territoire"
        | "Acteurs économiques";
      fiche_action_niveaux_priorite: "Élevé" | "Moyen" | "Bas";
      fiche_action_piliers_eci:
        | "Approvisionnement durable"
        | "Écoconception"
        | "Écologie industrielle (et territoriale)"
        | "Économie de la fonctionnalité"
        | "Consommation responsable"
        | "Allongement de la durée d’usage"
        | "Recyclage";
      fiche_action_resultats_attendus:
        | "Adaptation au changement climatique"
        | "Sensibilisation"
        | "Réduction des polluants atmosphériques"
        | "Réduction des émissions de gaz à effet de serre"
        | "Sobriété énergétique"
        | "Efficacité énergétique"
        | "Développement des énergies renouvelables";
      fiche_action_statuts:
        | "À venir"
        | "En cours"
        | "Réalisé"
        | "En pause"
        | "Abandonné";
      fiche_action_thematiques:
        | "Agriculture et alimentation"
        | "Bâtiments"
        | "Consommation responsable"
        | "Déchets"
        | "Développement économique"
        | "Eau"
        | "Forêts, biodiversité et espaces verts"
        | "Formation, sensibilisation, communication"
        | "Gestion, production et distribution de l’énergie"
        | "Mobilité"
        | "Organisation interne"
        | "Partenariats et coopération"
        | "Précarité énergétique"
        | "Stratégie"
        | "Tourisme"
        | "Urbanisme et aménagement";
      filterable_type_collectivite:
        | "commune"
        | "syndicat"
        | "CU"
        | "CC"
        | "POLEM"
        | "METRO"
        | "CA"
        | "EPT"
        | "PETR";
      indicateur_group: "cae" | "crte" | "eci";
      membre_fonction:
        | "referent"
        | "conseiller"
        | "technique"
        | "politique"
        | "partenaire";
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
        | "PETR";
      niveau_acces: "admin" | "edition" | "lecture";
      preuve_type:
        | "complementaire"
        | "reglementaire"
        | "labellisation"
        | "rapport";
      question_type: "choix" | "binaire" | "proportion";
      referentiel: "eci" | "cae";
      regle_type: "score" | "desactivation" | "reduction";
      role_name: "agent" | "referent" | "conseiller" | "auditeur" | "aucun";
      thematique_completude: "complete" | "a_completer";
      type_collectivite: "EPCI" | "commune" | "syndicat";
      usage_action: "clic" | "vue" | "telechargement" | "saisie" | "selection";
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
        | "filtre_remplissage";
      visite_onglet:
        | "progression"
        | "priorisation"
        | "detail"
        | "suivi"
        | "preuve"
        | "indicateur"
        | "historique"
        | "comparaison"
        | "critere";
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
        | "fiche";
      visite_tag:
        | "cae"
        | "eci"
        | "crte"
        | "referentiel"
        | "thematique"
        | "personnalise";
    };
    Functions: {
      action_contexte: {
        Args: { id: unknown };
        Returns: Record<string, unknown>[];
      };
      action_down_to_tache: {
        Args: {
          identifiant: string;
          referentiel: Database["public"]["Enums"]["referentiel"];
        };
        Returns: unknown;
      };
      action_exemples: {
        Args: { id: unknown };
        Returns: Record<string, unknown>[];
      };
      action_perimetre_evaluation: {
        Args: { id: unknown };
        Returns: Record<string, unknown>[];
      };
      action_preuve: {
        Args: { id: unknown };
        Returns: Record<string, unknown>[];
      };
      action_reduction_potentiel: {
        Args: { id: unknown };
        Returns: Record<string, unknown>[];
      };
      action_ressources: {
        Args: { id: unknown };
        Returns: Record<string, unknown>[];
      };
      add_bibliotheque_fichier: {
        Args: { collectivite_id: number; filename: string; hash: string };
        Returns: unknown;
      };
      add_compression_policy: {
        Args: {
          compress_after: unknown;
          hypertable: unknown;
          if_not_exists: boolean;
        };
        Returns: number;
      };
      add_continuous_aggregate_policy: {
        Args: {
          continuous_aggregate: unknown;
          end_offset: unknown;
          if_not_exists: boolean;
          schedule_interval: unknown;
          start_offset: unknown;
        };
        Returns: number;
      };
      add_data_node: {
        Args: {
          bootstrap: boolean;
          database: unknown;
          host: string;
          if_not_exists: boolean;
          node_name: unknown;
          password: string;
          port: number;
        };
        Returns: Record<string, unknown>[];
      };
      add_dimension: {
        Args: {
          chunk_time_interval: unknown;
          column_name: unknown;
          hypertable: unknown;
          if_not_exists: boolean;
          number_partitions: number;
          partitioning_func: unknown;
        };
        Returns: Record<string, unknown>[];
      };
      add_job: {
        Args: {
          config: Json;
          initial_start: string;
          proc: unknown;
          schedule_interval: unknown;
          scheduled: boolean;
        };
        Returns: number;
      };
      add_reorder_policy: {
        Args: {
          hypertable: unknown;
          if_not_exists: boolean;
          index_name: unknown;
        };
        Returns: number;
      };
      add_retention_policy: {
        Args: {
          drop_after: unknown;
          if_not_exists: boolean;
          relation: unknown;
        };
        Returns: number;
      };
      add_user: {
        Args: {
          collectivite_id: number;
          email: string;
          niveau: Database["public"]["Enums"]["niveau_acces"];
        };
        Returns: Json;
      };
      ajouter_action: {
        Args: { id_action: unknown; id_fiche: number };
        Returns: undefined;
      };
      ajouter_annexe: {
        Args: { annexe: unknown; id_fiche: number };
        Returns: unknown;
      };
      ajouter_fiche_action_dans_un_axe: {
        Args: { id_axe: number; id_fiche: number };
        Returns: undefined;
      };
      ajouter_indicateur: {
        Args: { id_fiche: number; indicateur: unknown };
        Returns: undefined;
      };
      ajouter_partenaire: {
        Args: { id_fiche: number; partenaire: unknown };
        Returns: unknown;
      };
      ajouter_pilote: {
        Args: { id_fiche: number; pilote: unknown };
        Returns: unknown;
      };
      ajouter_referent: {
        Args: { id_fiche: number; referent: unknown };
        Returns: unknown;
      };
      ajouter_structure: {
        Args: { id_fiche: number; structure: unknown };
        Returns: unknown;
      };
      alter_job: {
        Args: {
          config: Json;
          if_exists: boolean;
          job_id: number;
          max_retries: number;
          max_runtime: unknown;
          next_start: string;
          retry_period: unknown;
          schedule_interval: unknown;
          scheduled: boolean;
        };
        Returns: Record<string, unknown>[];
      };
      approximate_row_count: {
        Args: { relation: unknown };
        Returns: number;
      };
      attach_data_node: {
        Args: {
          hypertable: unknown;
          if_not_attached: boolean;
          node_name: unknown;
          repartition: boolean;
        };
        Returns: Record<string, unknown>[];
      };
      attach_tablespace: {
        Args: {
          hypertable: unknown;
          if_not_attached: boolean;
          tablespace: unknown;
        };
        Returns: undefined;
      };
      business_insert_actions: {
        Args: {
          computed_points: unknown;
          definitions: unknown;
          relations: unknown;
        };
        Returns: undefined;
      };
      business_update_actions: {
        Args: { computed_points: unknown; definitions: unknown };
        Returns: undefined;
      };
      business_upsert_indicateurs: {
        Args: { indicateur_actions: unknown; indicateur_definitions: unknown };
        Returns: undefined;
      };
      chunk_compression_stats: {
        Args: { hypertable: unknown };
        Returns: Record<string, unknown>[];
      };
      chunks_detailed_size: {
        Args: { hypertable: unknown };
        Returns: Record<string, unknown>[];
      };
      claim_collectivite: {
        Args: { id: number };
        Returns: Json;
      };
      collectivite_membres: {
        Args: { id: number };
        Returns: Record<string, unknown>[];
      };
      compress_chunk: {
        Args: { if_not_compressed: boolean; uncompressed_chunk: unknown };
        Returns: unknown;
      };
      consume_invitation: {
        Args: { id: string };
        Returns: undefined;
      };
      create_distributed_hypertable: {
        Args: {
          associated_schema_name: unknown;
          associated_table_prefix: unknown;
          chunk_sizing_func: unknown;
          chunk_target_size: string;
          chunk_time_interval: unknown;
          create_default_indexes: boolean;
          data_nodes: unknown;
          if_not_exists: boolean;
          migrate_data: boolean;
          number_partitions: number;
          partitioning_column: unknown;
          partitioning_func: unknown;
          relation: unknown;
          replication_factor: number;
          time_column_name: unknown;
          time_partitioning_func: unknown;
        };
        Returns: Record<string, unknown>[];
      };
      create_distributed_restore_point: {
        Args: { name: string };
        Returns: Record<string, unknown>[];
      };
      create_hypertable: {
        Args: {
          associated_schema_name: unknown;
          associated_table_prefix: unknown;
          chunk_sizing_func: unknown;
          chunk_target_size: string;
          chunk_time_interval: unknown;
          create_default_indexes: boolean;
          data_nodes: unknown;
          if_not_exists: boolean;
          migrate_data: boolean;
          number_partitions: number;
          partitioning_column: unknown;
          partitioning_func: unknown;
          relation: unknown;
          replication_factor: number;
          time_column_name: unknown;
          time_partitioning_func: unknown;
        };
        Returns: Record<string, unknown>[];
      };
      decompress_chunk: {
        Args: { if_compressed: boolean; uncompressed_chunk: unknown };
        Returns: unknown;
      };
      delete_data_node: {
        Args: {
          drop_database: boolean;
          force: boolean;
          if_exists: boolean;
          node_name: unknown;
          repartition: boolean;
        };
        Returns: boolean;
      };
      delete_job: {
        Args: { job_id: number };
        Returns: undefined;
      };
      detach_data_node: {
        Args: {
          force: boolean;
          hypertable: unknown;
          if_attached: boolean;
          node_name: unknown;
          repartition: boolean;
        };
        Returns: number;
      };
      detach_tablespace: {
        Args: {
          hypertable: unknown;
          if_attached: boolean;
          tablespace: unknown;
        };
        Returns: number;
      };
      detach_tablespaces: {
        Args: { hypertable: unknown };
        Returns: number;
      };
      drop_chunks: {
        Args: {
          newer_than: unknown;
          older_than: unknown;
          relation: unknown;
          verbose: boolean;
        };
        Returns: string;
      };
      enlever_action: {
        Args: { id_action: unknown; id_fiche: number };
        Returns: undefined;
      };
      enlever_annexe: {
        Args: { annexe: unknown; id_fiche: number; supprimer: boolean };
        Returns: undefined;
      };
      enlever_fiche_action_d_un_axe: {
        Args: { id_axe: number; id_fiche: number };
        Returns: undefined;
      };
      enlever_indicateur: {
        Args: { id_fiche: number; indicateur: unknown };
        Returns: undefined;
      };
      enlever_partenaire: {
        Args: { id_fiche: number; partenaire: unknown };
        Returns: undefined;
      };
      enlever_pilote: {
        Args: { id_fiche: number; pilote: unknown };
        Returns: undefined;
      };
      enlever_referent: {
        Args: { id_fiche: number; referent: unknown };
        Returns: undefined;
      };
      enlever_structure: {
        Args: { id_fiche: number; structure: unknown };
        Returns: undefined;
      };
      est_auditeur: {
        Args: { col: number };
        Returns: boolean;
      };
      gbt_bit_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_bpchar_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_bytea_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_cash_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_cash_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_date_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_date_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_decompress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_enum_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_enum_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_float4_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_float4_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_float8_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_float8_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_inet_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_int2_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_int2_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_int4_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_int4_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_int8_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_int8_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_intv_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_intv_decompress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_intv_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_macad8_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_macad8_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_macad_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_macad_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_numeric_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_oid_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_oid_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_text_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_time_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_time_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_timetz_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_ts_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_ts_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_tstz_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_uuid_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_uuid_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_var_decompress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbt_var_fetch: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbtreekey16_in: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbtreekey16_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbtreekey32_in: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbtreekey32_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbtreekey4_in: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbtreekey4_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbtreekey8_in: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbtreekey8_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbtreekey_var_in: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gbtreekey_var_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      get_telemetry_report: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      have_admin_acces: {
        Args: { id: number };
        Returns: boolean;
      };
      have_discussion_edition_acces: {
        Args: { id: number };
        Returns: boolean;
      };
      have_discussion_lecture_acces: {
        Args: { id: number };
        Returns: boolean;
      };
      have_edition_acces: {
        Args: { id: number };
        Returns: boolean;
      };
      have_lecture_acces: {
        Args: { id: number };
        Returns: boolean;
      };
      have_one_of_niveaux_acces: {
        Args: { id: number; niveaux: unknown };
        Returns: boolean;
      };
      hypertable_compression_stats: {
        Args: { hypertable: unknown };
        Returns: Record<string, unknown>[];
      };
      hypertable_detailed_size: {
        Args: { hypertable: unknown };
        Returns: Record<string, unknown>[];
      };
      hypertable_index_size: {
        Args: { index_name: unknown };
        Returns: number;
      };
      hypertable_size: {
        Args: { hypertable: unknown };
        Returns: number;
      };
      indicateurs_collectivite: {
        Args: { id_collectivite: number };
        Returns: unknown;
      };
      interpolate:
        | {
            Args: {
              next: Record<string, unknown>[];
              prev: Record<string, unknown>[];
              value: number;
            };
            Returns: number;
          }
        | {
            Args: {
              next: Record<string, unknown>[];
              prev: Record<string, unknown>[];
              value: number;
            };
            Returns: number;
          }
        | {
            Args: {
              next: Record<string, unknown>[];
              prev: Record<string, unknown>[];
              value: number;
            };
            Returns: number;
          }
        | {
            Args: {
              next: Record<string, unknown>[];
              prev: Record<string, unknown>[];
              value: number;
            };
            Returns: number;
          }
        | {
            Args: {
              next: Record<string, unknown>[];
              prev: Record<string, unknown>[];
              value: number;
            };
            Returns: number;
          };
      is_agent_of: {
        Args: { id: number };
        Returns: boolean;
      };
      is_any_role_on: {
        Args: { id: number };
        Returns: boolean;
      };
      is_authenticated: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_bucket_writer: {
        Args: { id: string };
        Returns: boolean;
      };
      is_referent_of: {
        Args: { id: number };
        Returns: boolean;
      };
      is_service_role: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      json_matches_schema: {
        Args: { instance: Json; schema: Json };
        Returns: boolean;
      };
      jsonb_matches_schema: {
        Args: { instance: Json; schema: Json };
        Returns: boolean;
      };
      labellisation_demande: {
        Args: {
          collectivite_id: number;
          etoiles: "1" | "2" | "3" | "4" | "5";
          referentiel: Database["public"]["Enums"]["referentiel"];
        };
        Returns: unknown;
      };
      labellisation_parcours: {
        Args: { collectivite_id: number };
        Returns: Record<string, unknown>[];
      };
      labellisation_submit_demande: {
        Args: {
          collectivite_id: number;
          etoiles: "1" | "2" | "3" | "4" | "5";
          referentiel: Database["public"]["Enums"]["referentiel"];
        };
        Returns: unknown;
      };
      locf: {
        Args: { prev: unknown; treat_null_as_missing: boolean; value: unknown };
        Returns: unknown;
      };
      move_chunk: {
        Args: {
          chunk: unknown;
          destination_tablespace: unknown;
          index_destination_tablespace: unknown;
          reorder_index: unknown;
          verbose: boolean;
        };
        Returns: undefined;
      };
      naturalsort: {
        Args: { "": string };
        Returns: string;
      };
      personnes_collectivite: {
        Args: { id_collectivite: number };
        Returns: unknown;
      };
      peut_modifier_la_fiche: {
        Args: { id_fiche: number };
        Returns: boolean;
      };
      plan_action: {
        Args: { pa_id: number };
        Returns: Json;
      };
      plans_action_collectivite: {
        Args: { id_collectivite: number };
        Returns: unknown;
      };
      quit_collectivite: {
        Args: { id: number };
        Returns: Json;
      };
      referent_contact: {
        Args: { id: number };
        Returns: Json;
      };
      referent_contacts: {
        Args: { id: number };
        Returns: Record<string, unknown>[];
      };
      referentiel_down_to_action: {
        Args: { referentiel: Database["public"]["Enums"]["referentiel"] };
        Returns: unknown;
      };
      remove_compression_policy: {
        Args: { hypertable: unknown; if_exists: boolean };
        Returns: boolean;
      };
      remove_continuous_aggregate_policy: {
        Args: { continuous_aggregate: unknown; if_not_exists: boolean };
        Returns: undefined;
      };
      remove_membre_from_collectivite: {
        Args: { collectivite_id: number; email: string };
        Returns: Json;
      };
      remove_reorder_policy: {
        Args: { hypertable: unknown; if_exists: boolean };
        Returns: undefined;
      };
      remove_retention_policy: {
        Args: { if_exists: boolean; relation: unknown };
        Returns: undefined;
      };
      reorder_chunk: {
        Args: { chunk: unknown; index: unknown; verbose: boolean };
        Returns: undefined;
      };
      retool_user_list: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>[];
      };
      save_reponse: {
        Args: { "": Json };
        Returns: undefined;
      };
      set_adaptive_chunking: {
        Args: { chunk_target_size: string; hypertable: unknown };
        Returns: Record<string, unknown>[];
      };
      set_chunk_time_interval: {
        Args: {
          chunk_time_interval: unknown;
          dimension_name: unknown;
          hypertable: unknown;
        };
        Returns: undefined;
      };
      set_integer_now_func: {
        Args: {
          hypertable: unknown;
          integer_now_func: unknown;
          replace_if_exists: boolean;
        };
        Returns: undefined;
      };
      set_number_partitions: {
        Args: {
          dimension_name: unknown;
          hypertable: unknown;
          number_partitions: number;
        };
        Returns: undefined;
      };
      set_replication_factor: {
        Args: { hypertable: unknown; replication_factor: number };
        Returns: undefined;
      };
      show_chunks: {
        Args: { newer_than: unknown; older_than: unknown; relation: unknown };
        Returns: unknown;
      };
      show_tablespaces: {
        Args: { hypertable: unknown };
        Returns: unknown;
      };
      teapot: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      test_add_random_user: {
        Args: {
          collectivite_id: number;
          niveau: Database["public"]["Enums"]["niveau_acces"];
        };
        Returns: Record<string, unknown>[];
      };
      test_attach_user: {
        Args: {
          collectivite_id: number;
          niveau: Database["public"]["Enums"]["niveau_acces"];
          user_id: string;
        };
        Returns: undefined;
      };
      test_clear_history: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      test_create_user: {
        Args: { email: string; nom: string; prenom: string; user_id: string };
        Returns: undefined;
      };
      test_disable_fake_score_generation: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      test_enable_fake_score_generation: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      test_fulfill: {
        Args: { collectivite_id: number; etoile: "1" | "2" | "3" | "4" | "5" };
        Returns: undefined;
      };
      test_generate_fake_scores: {
        Args: {
          collectivite_id: number;
          referentiel: Database["public"]["Enums"]["referentiel"];
          statuts: unknown;
        };
        Returns: Json;
      };
      test_remove_user: {
        Args: { email: string };
        Returns: undefined;
      };
      test_reset: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      test_reset_action_statut_and_desc: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      test_reset_audit: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      test_reset_discussion_et_commentaires: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      test_reset_droits: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      test_reset_membres: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      test_reset_plan_action: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      test_reset_preuves: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      test_reset_reponse: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      test_reset_users: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      test_write_scores: {
        Args: { collectivite_id: number; scores: unknown };
        Returns: undefined;
      };
      time_bucket:
        | {
            Args: { bucket_width: unknown; ts: string };
            Returns: string;
          }
        | {
            Args: { bucket_width: unknown; ts: string };
            Returns: string;
          }
        | {
            Args: { bucket_width: unknown; ts: string };
            Returns: string;
          }
        | {
            Args: { bucket_width: unknown; origin: string; ts: string };
            Returns: string;
          }
        | {
            Args: { bucket_width: unknown; origin: string; ts: string };
            Returns: string;
          }
        | {
            Args: { bucket_width: unknown; origin: string; ts: string };
            Returns: string;
          }
        | {
            Args: { bucket_width: number; ts: number };
            Returns: number;
          }
        | {
            Args: { bucket_width: number; ts: number };
            Returns: number;
          }
        | {
            Args: { bucket_width: number; ts: number };
            Returns: number;
          }
        | {
            Args: { bucket_width: number; offset: number; ts: number };
            Returns: number;
          }
        | {
            Args: { bucket_width: number; offset: number; ts: number };
            Returns: number;
          }
        | {
            Args: { bucket_width: number; offset: number; ts: number };
            Returns: number;
          }
        | {
            Args: { bucket_width: unknown; offset: unknown; ts: string };
            Returns: string;
          }
        | {
            Args: { bucket_width: unknown; offset: unknown; ts: string };
            Returns: string;
          }
        | {
            Args: { bucket_width: unknown; offset: unknown; ts: string };
            Returns: string;
          };
      time_bucket_gapfill:
        | {
            Args: {
              bucket_width: unknown;
              finish: string;
              start: string;
              ts: string;
            };
            Returns: string;
          }
        | {
            Args: {
              bucket_width: number;
              finish: number;
              start: number;
              ts: number;
            };
            Returns: number;
          }
        | {
            Args: {
              bucket_width: number;
              finish: number;
              start: number;
              ts: number;
            };
            Returns: number;
          }
        | {
            Args: {
              bucket_width: number;
              finish: number;
              start: number;
              ts: number;
            };
            Returns: number;
          }
        | {
            Args: {
              bucket_width: unknown;
              finish: string;
              start: string;
              ts: string;
            };
            Returns: string;
          }
        | {
            Args: {
              bucket_width: unknown;
              finish: string;
              start: string;
              ts: string;
            };
            Returns: string;
          };
      timescaledb_fdw_handler: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      timescaledb_post_restore: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      timescaledb_pre_restore: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      unaccent: {
        Args: { "": string };
        Returns: string;
      };
      unaccent_init: {
        Args: { "": unknown };
        Returns: unknown;
      };
      update_collectivite_membre_champ_intervention: {
        Args: {
          champ_intervention: unknown;
          collectivite_id: number;
          membre_id: string;
        };
        Returns: Json;
      };
      update_collectivite_membre_details_fonction: {
        Args: {
          collectivite_id: number;
          details_fonction: string;
          membre_id: string;
        };
        Returns: Json;
      };
      update_collectivite_membre_fonction: {
        Args: {
          collectivite_id: number;
          fonction: Database["public"]["Enums"]["membre_fonction"];
          membre_id: string;
        };
        Returns: Json;
      };
      update_collectivite_membre_niveau_acces: {
        Args: {
          collectivite_id: number;
          membre_id: string;
          niveau_acces: Database["public"]["Enums"]["niveau_acces"];
        };
        Returns: Json;
      };
    };
    Tables: {
      abstract_any_indicateur_value: {
        Row: {
          valeur: number | null
          annee: number
          modified_at: string
        }
        Insert: {
          valeur?: number | null
          annee: number
          modified_at?: string
        }
        Update: {
          valeur?: number | null
          annee?: number
          modified_at?: string
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
          action_id: string
          value: number
          modified_at: string
        }
        Insert: {
          action_id: string
          value: number
          modified_at?: string
        }
        Update: {
          action_id?: string
          value?: number
          modified_at?: string
        }
      }
      action_definition: {
        Row: {
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
          points: number | null
          pourcentage: number | null
          categorie: Database["public"]["Enums"]["action_categorie"] | null
          modified_at: string
          preuve: string | null
        }
        Insert: {
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
          points?: number | null
          pourcentage?: number | null
          categorie?: Database["public"]["Enums"]["action_categorie"] | null
          modified_at?: string
          preuve?: string | null
        }
        Update: {
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
          points?: number | null
          pourcentage?: number | null
          categorie?: Database["public"]["Enums"]["action_categorie"] | null
          modified_at?: string
          preuve?: string | null
        }
      }
      action_discussion: {
        Row: {
          collectivite_id: number
          action_id: string
          id: number
          created_by: string
          created_at: string
          modified_at: string
          status: Database["public"]["Enums"]["action_discussion_statut"]
        }
        Insert: {
          collectivite_id: number
          action_id: string
          id?: number
          created_by?: string
          created_at?: string
          modified_at?: string
          status?: Database["public"]["Enums"]["action_discussion_statut"]
        }
        Update: {
          collectivite_id?: number
          action_id?: string
          id?: number
          created_by?: string
          created_at?: string
          modified_at?: string
          status?: Database["public"]["Enums"]["action_discussion_statut"]
        }
      }
      action_discussion_commentaire: {
        Row: {
          discussion_id: number
          message: string
          id: number
          created_by: string
          created_at: string
        }
        Insert: {
          discussion_id: number
          message: string
          id?: number
          created_by?: string
          created_at?: string
        }
        Update: {
          discussion_id?: number
          message?: string
          id?: number
          created_by?: string
          created_at?: string
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
      annexe: {
        Row: {
          collectivite_id: number
          fichier_id: number | null
          url: string | null
          id: number
          titre: string
          commentaire: string
          modified_by: string
          modified_at: string
          lien: Json | null
        }
        Insert: {
          collectivite_id: number
          fichier_id?: number | null
          url?: string | null
          id?: number
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
        }
        Update: {
          collectivite_id?: number
          fichier_id?: number | null
          url?: string | null
          id?: number
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
        }
      }
      audit: {
        Row: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          demande_id: number | null
          date_fin: string | null
          id: number
          date_debut: string
        }
        Insert: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          demande_id?: number | null
          date_fin?: string | null
          id?: number
          date_debut?: string
        }
        Update: {
          collectivite_id?: number
          referentiel?: Database["public"]["Enums"]["referentiel"]
          demande_id?: number | null
          date_fin?: string | null
          id?: number
          date_debut?: string
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
      axe: {
        Row: {
          nom: string | null
          collectivite_id: number
          parent: number | null
          modified_at: string
          id: number
          created_at: string
          modified_by: string | null
        }
        Insert: {
          nom?: string | null
          collectivite_id: number
          parent?: number | null
          modified_at?: string
          id?: number
          created_at?: string
          modified_by?: string | null
        }
        Update: {
          nom?: string | null
          collectivite_id?: number
          parent?: number | null
          modified_at?: string
          id?: number
          created_at?: string
          modified_by?: string | null
        }
      }
      client_scores: {
        Row: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          scores: Json
          payload_timestamp: string | null
          modified_at: string
        }
        Insert: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          scores: Json
          payload_timestamp?: string | null
          modified_at: string
        }
        Update: {
          collectivite_id?: number
          referentiel?: Database["public"]["Enums"]["referentiel"]
          scores?: Json
          payload_timestamp?: string | null
          modified_at?: string
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
          collectivite_id: number | null
          nom: string
          id: number
        }
        Insert: {
          collectivite_id?: number | null
          nom: string
          id?: number
        }
        Update: {
          collectivite_id?: number | null
          nom?: string
          id?: number
        }
      }
      commune: {
        Row: {
          collectivite_id: number | null
          nom: string
          code: string
          id: number
        }
        Insert: {
          collectivite_id?: number | null
          nom: string
          code: string
          id?: number
        }
        Update: {
          collectivite_id?: number | null
          nom?: string
          code?: string
          id?: number
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
          collectivite_id: number | null
          nom: string
          siren: string
          nature: Database["public"]["Enums"]["nature"]
          id: number
        }
        Insert: {
          collectivite_id?: number | null
          nom: string
          siren: string
          nature: Database["public"]["Enums"]["nature"]
          id?: number
        }
        Update: {
          collectivite_id?: number | null
          nom?: string
          siren?: string
          nature?: Database["public"]["Enums"]["nature"]
          id?: number
        }
      }
      fiche_action: {
        Insert: {
          amelioration_continue?: boolean | null;
          budget_previsionnel?: number | null;
          calendrier?: string | null;
          cibles?: Database["public"]["Enums"]["fiche_action_cibles"][] | null;
          collectivite_id: number;
          date_debut?: string | null;
          date_fin_provisoire?: string | null;
          description?: string | null;
          financements?: string | null;
          id?: number;
          maj_termine?: boolean | null;
          niveau_priorite?:
            | Database["public"]["Enums"]["fiche_action_niveaux_priorite"]
            | null;
          notes_complementaires?: string | null;
          objectifs?: string | null;
          piliers_eci?:
            | Database["public"]["Enums"]["fiche_action_piliers_eci"][]
            | null;
          ressources?: string | null;
          resultats_attendus?:
            | Database["public"]["Enums"]["fiche_action_resultats_attendus"][]
            | null;
          sous_thematiques?:
            | Database["public"]["Enums"]["fiche_action_thematiques"][]
            | null;
          statut?: Database["public"]["Enums"]["fiche_action_statuts"] | null;
          thematiques?:
            | Database["public"]["Enums"]["fiche_action_thematiques"][]
            | null;
          titre?: string | null;
        };
        Row: {
          description: string | null
          piliers_eci:
            | Database["public"]["Enums"]["fiche_action_piliers_eci"][]
            | null
          objectifs: string | null
          resultats_attendus:
            | Database["public"]["Enums"]["fiche_action_resultats_attendus"][]
            | null
          cibles: Database["public"]["Enums"]["fiche_action_cibles"][] | null
          ressources: string | null
          financements: string | null
          budget_previsionnel: number | null
          statut: Database["public"]["Enums"]["fiche_action_statuts"] | null
          niveau_priorite:
            | Database["public"]["Enums"]["fiche_action_niveaux_priorite"]
            | null
          date_debut: string | null
          date_fin_provisoire: string | null
          amelioration_continue: boolean | null
          calendrier: string | null
          notes_complementaires: string | null
          maj_termine: boolean | null
          collectivite_id: number
          modified_at: string
          id: number
          titre: string | null
          created_at: string
          modified_by: string | null
        }
        Insert: {
          description?: string | null
          piliers_eci?:
            | Database["public"]["Enums"]["fiche_action_piliers_eci"][]
            | null
          objectifs?: string | null
          resultats_attendus?:
            | Database["public"]["Enums"]["fiche_action_resultats_attendus"][]
            | null
          cibles?: Database["public"]["Enums"]["fiche_action_cibles"][] | null
          ressources?: string | null
          financements?: string | null
          budget_previsionnel?: number | null
          statut?: Database["public"]["Enums"]["fiche_action_statuts"] | null
          niveau_priorite?:
            | Database["public"]["Enums"]["fiche_action_niveaux_priorite"]
            | null
          date_debut?: string | null
          date_fin_provisoire?: string | null
          amelioration_continue?: boolean | null
          calendrier?: string | null
          notes_complementaires?: string | null
          maj_termine?: boolean | null
          collectivite_id: number
          modified_at?: string
          id?: number
          titre?: string | null
          created_at?: string
          modified_by?: string | null
        }
        Update: {
          description?: string | null
          piliers_eci?:
            | Database["public"]["Enums"]["fiche_action_piliers_eci"][]
            | null
          objectifs?: string | null
          resultats_attendus?:
            | Database["public"]["Enums"]["fiche_action_resultats_attendus"][]
            | null
          cibles?: Database["public"]["Enums"]["fiche_action_cibles"][] | null
          ressources?: string | null
          financements?: string | null
          budget_previsionnel?: number | null
          statut?: Database["public"]["Enums"]["fiche_action_statuts"] | null
          niveau_priorite?:
            | Database["public"]["Enums"]["fiche_action_niveaux_priorite"]
            | null
          date_debut?: string | null
          date_fin_provisoire?: string | null
          amelioration_continue?: boolean | null
          calendrier?: string | null
          notes_complementaires?: string | null
          maj_termine?: boolean | null
          collectivite_id?: number
          modified_at?: string
          id?: number
          titre?: string | null
          created_at?: string
          modified_by?: string | null
        }
      }
      fiche_action_action: {
        Row: {
          fiche_id: number
          action_id: string
        }
        Insert: {
          fiche_id: number
          action_id: string
        }
        Update: {
          fiche_id?: number
          action_id?: string
        }
      }
      fiche_action_annexe: {
        Row: {
          fiche_id: number
          annexe_id: number
        }
        Insert: {
          fiche_id: number
          annexe_id: number
        }
        Update: {
          fiche_id?: number
          annexe_id?: number
        }
      }
      fiche_action_axe: {
        Row: {
          fiche_id: number
          axe_id: number
        }
        Insert: {
          fiche_id: number
          axe_id: number
        }
        Update: {
          fiche_id?: number
          axe_id?: number
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
          user_id: string | null
          tag_id: number | null
        }
        Insert: {
          fiche_id: number
          user_id?: string | null
          tag_id?: number | null
        }
        Update: {
          fiche_id?: number
          user_id?: string | null
          tag_id?: number | null
        }
      }
      fiche_action_referent: {
        Row: {
          fiche_id: number
          user_id: string | null
          tag_id: number | null
        }
        Insert: {
          fiche_id: number
          user_id?: string | null
          tag_id?: number | null
        }
        Update: {
          fiche_id?: number
          user_id?: string | null
          tag_id?: number | null
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
          indicateur_id: string
          action_id: string
          modified_at: string
        }
        Insert: {
          indicateur_id: string
          action_id: string
          modified_at?: string
        }
        Update: {
          indicateur_id?: string
          action_id?: string
          modified_at?: string
        }
      }
      indicateur_commentaire: {
        Row: {
          collectivite_id: number
          indicateur_id: string
          commentaire: string
          modified_at: string
          modified_by: string
        }
        Insert: {
          collectivite_id: number
          indicateur_id: string
          commentaire: string
          modified_at?: string
          modified_by?: string
        }
        Update: {
          collectivite_id?: number
          indicateur_id?: string
          commentaire?: string
          modified_at?: string
          modified_by?: string
        }
      }
      indicateur_definition: {
        Row: {
          id: string
          indicateur_group: Database["public"]["Enums"]["indicateur_group"]
          identifiant: string
          valeur_indicateur: string | null
          nom: string
          description: string
          unite: string
          obligation_eci: boolean
          parent: number | null
          modified_at: string
        }
        Insert: {
          id: string
          indicateur_group: Database["public"]["Enums"]["indicateur_group"]
          identifiant: string
          valeur_indicateur?: string | null
          nom: string
          description: string
          unite: string
          obligation_eci: boolean
          parent?: number | null
          modified_at?: string
        }
        Update: {
          id?: string
          indicateur_group?: Database["public"]["Enums"]["indicateur_group"]
          identifiant?: string
          valeur_indicateur?: string | null
          nom?: string
          description?: string
          unite?: string
          obligation_eci?: boolean
          parent?: number | null
          modified_at?: string
        }
      }
      indicateur_objectif: {
        Row: {
          valeur: number | null
          annee: number
          collectivite_id: number
          indicateur_id: string
          modified_at: string
        }
        Insert: {
          valeur?: number | null
          annee: number
          collectivite_id: number
          indicateur_id: string
          modified_at?: string
        }
        Update: {
          valeur?: number | null
          annee?: number
          collectivite_id?: number
          indicateur_id?: string
          modified_at?: string
        }
      }
      indicateur_parent: {
        Row: {
          numero: string
          nom: string
          id: number
        }
        Insert: {
          numero: string
          nom: string
          id?: number
        }
        Update: {
          numero?: string
          nom?: string
          id?: number
        }
      }
      indicateur_personnalise_definition: {
        Row: {
          collectivite_id: number | null
          titre: string
          description: string
          unite: string
          commentaire: string
          modified_at: string
          id: number
          modified_by: string
        }
        Insert: {
          collectivite_id?: number | null
          titre: string
          description: string
          unite: string
          commentaire: string
          modified_at?: string
          id?: number
          modified_by?: string
        }
        Update: {
          collectivite_id?: number | null
          titre?: string
          description?: string
          unite?: string
          commentaire?: string
          modified_at?: string
          id?: number
          modified_by?: string
        }
      }
      indicateur_personnalise_objectif: {
        Row: {
          valeur: number | null
          annee: number
          collectivite_id: number
          indicateur_id: number
          modified_at: string
        }
        Insert: {
          valeur?: number | null
          annee: number
          collectivite_id: number
          indicateur_id: number
          modified_at?: string
        }
        Update: {
          valeur?: number | null
          annee?: number
          collectivite_id?: number
          indicateur_id?: number
          modified_at?: string
        }
      }
      indicateur_personnalise_resultat: {
        Row: {
          valeur: number | null
          annee: number
          collectivite_id: number
          indicateur_id: number
          modified_at: string
        }
        Insert: {
          valeur?: number | null
          annee: number
          collectivite_id: number
          indicateur_id: number
          modified_at?: string
        }
        Update: {
          valeur?: number | null
          annee?: number
          collectivite_id?: number
          indicateur_id?: number
          modified_at?: string
        }
      }
      indicateur_resultat: {
        Row: {
          valeur: number | null
          annee: number
          collectivite_id: number
          indicateur_id: string
          modified_at: string
        }
        Insert: {
          valeur?: number | null
          annee: number
          collectivite_id: number
          indicateur_id: string
          modified_at?: string
        }
        Update: {
          valeur?: number | null
          annee?: number
          collectivite_id?: number
          indicateur_id?: string
          modified_at?: string
        }
      }
      indicateur_terristory_json: {
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
          collectivite_id: number | null
          referentiel: Database["public"]["Enums"]["referentiel"]
          obtenue_le: string
          etoiles: number
          score_realise: number | null
          score_programme: number | null
          id: number
          annee: number | null
        }
        Insert: {
          collectivite_id?: number | null
          referentiel: Database["public"]["Enums"]["referentiel"]
          obtenue_le: string
          etoiles: number
          score_realise?: number | null
          score_programme?: number | null
          id?: number
          annee?: number | null
        }
        Update: {
          collectivite_id?: number | null
          referentiel?: Database["public"]["Enums"]["referentiel"]
          obtenue_le?: string
          etoiles?: number
          score_realise?: number | null
          score_programme?: number | null
          id?: number
          annee?: number | null
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
          nom: string
          collectivite_id: number
          id: number
        }
        Insert: {
          nom: string
          collectivite_id: number
          id?: number
        }
        Update: {
          nom?: string
          collectivite_id?: number
          id?: number
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
      personne_tag: {
        Row: {
          nom: string
          collectivite_id: number
          id: number
        }
        Insert: {
          nom: string
          collectivite_id: number
          id?: number
        }
        Update: {
          nom?: string
          collectivite_id?: number
          id?: number
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
          collectivite_id: number
          fichier_id: number | null
          url: string | null
          action_id: string
          id: number
          titre: string
          commentaire: string
          modified_by: string
          modified_at: string
          lien: Json | null
        }
        Insert: {
          collectivite_id: number
          fichier_id?: number | null
          url?: string | null
          action_id: string
          id?: number
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
        }
        Update: {
          collectivite_id?: number
          fichier_id?: number | null
          url?: string | null
          action_id?: string
          id?: number
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
        }
      }
      preuve_labellisation: {
        Row: {
          collectivite_id: number
          fichier_id: number | null
          url: string | null
          demande_id: number
          id: number
          titre: string
          commentaire: string
          modified_by: string
          modified_at: string
          lien: Json | null
        }
        Insert: {
          collectivite_id: number
          fichier_id?: number | null
          url?: string | null
          demande_id: number
          id?: number
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
        }
        Update: {
          collectivite_id?: number
          fichier_id?: number | null
          url?: string | null
          demande_id?: number
          id?: number
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
        }
      }
      preuve_rapport: {
        Row: {
          collectivite_id: number
          fichier_id: number | null
          url: string | null
          date: string
          id: number
          titre: string
          commentaire: string
          modified_by: string
          modified_at: string
          lien: Json | null
        }
        Insert: {
          collectivite_id: number
          fichier_id?: number | null
          url?: string | null
          date: string
          id?: number
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
        }
        Update: {
          collectivite_id?: number
          fichier_id?: number | null
          url?: string | null
          date?: string
          id?: number
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
        }
      }
      preuve_reglementaire: {
        Row: {
          collectivite_id: number
          fichier_id: number | null
          url: string | null
          preuve_id: string
          id: number
          titre: string
          commentaire: string
          modified_by: string
          modified_at: string
          lien: Json | null
        }
        Insert: {
          collectivite_id: number
          fichier_id?: number | null
          url?: string | null
          preuve_id: string
          id?: number
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
        }
        Update: {
          collectivite_id?: number
          fichier_id?: number | null
          url?: string | null
          preuve_id?: string
          id?: number
          titre?: string
          commentaire?: string
          modified_by?: string
          modified_at?: string
          lien?: Json | null
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
        Insert: {
          champ_intervention?:
            | Database["public"]["Enums"]["referentiel"][]
            | null;
          collectivite_id: number;
          created_at?: string;
          details_fonction?: string | null;
          fonction?: Database["public"]["Enums"]["membre_fonction"] | null;
          modified_at?: string;
          user_id: string;
        };
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
          user_id: string
          collectivite_id: number
          active: boolean
          id: number
          created_at: string
          modified_at: string
          niveau_acces: Database["public"]["Enums"]["niveau_acces"]
          invitation_id: string | null
        }
        Insert: {
          user_id: string
          collectivite_id: number
          active: boolean
          id?: number
          created_at?: string
          modified_at?: string
          niveau_acces?: Database["public"]["Enums"]["niveau_acces"]
          invitation_id?: string | null
        }
        Update: {
          user_id?: string
          collectivite_id?: number
          active?: boolean
          id?: number
          created_at?: string
          modified_at?: string
          niveau_acces?: Database["public"]["Enums"]["niveau_acces"]
          invitation_id?: string | null
        }
      }
      question: {
        Insert: {
          description: string;
          formulation: string;
          id: string;
          ordonnancement?: number | null;
          thematique_id?: string | null;
          type: Database["public"]["Enums"]["question_type"];
          types_collectivites_concernees?:
            | Database["public"]["Enums"]["type_collectivite"][]
            | null;
        };
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
          collectivite_id: number
          question_id: string
          reponse: boolean | null
          modified_at: string
        }
        Insert: {
          collectivite_id: number
          question_id: string
          reponse?: boolean | null
          modified_at?: string
        }
        Update: {
          collectivite_id?: number
          question_id?: string
          reponse?: boolean | null
          modified_at?: string
        }
      }
      reponse_choix: {
        Row: {
          collectivite_id: number
          question_id: string
          reponse: string | null
          modified_at: string
        }
        Insert: {
          collectivite_id: number
          question_id: string
          reponse?: string | null
          modified_at?: string
        }
        Update: {
          collectivite_id?: number
          question_id?: string
          reponse?: string | null
          modified_at?: string
        }
      }
      reponse_proportion: {
        Row: {
          collectivite_id: number
          question_id: string
          reponse: number | null
          modified_at: string
        }
        Insert: {
          collectivite_id: number
          question_id: string
          reponse?: number | null
          modified_at?: string
        }
        Update: {
          collectivite_id?: number
          question_id?: string
          reponse?: number | null
          modified_at?: string
        }
      }
      sous_thematique: {
        Row: {
          thematique: string
          sous_thematique: string
          id: number
        }
        Insert: {
          thematique: string
          sous_thematique: string
          id?: number
        }
        Update: {
          thematique?: string
          sous_thematique?: string
          id?: number
        }
      }
      structure_tag: {
        Row: {
          nom: string
          collectivite_id: number
          id: number
        }
        Insert: {
          nom: string
          collectivite_id: number
          id?: number
        }
        Update: {
          nom?: string
          collectivite_id?: number
          id?: number
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
          avancement: Database["public"]["Enums"]["avancement"] | null
          concerne: boolean | null
          desactive: boolean | null
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
          avancement?: Database["public"]["Enums"]["avancement"] | null
          concerne?: boolean | null
          desactive?: boolean | null
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
          avancement?: Database["public"]["Enums"]["avancement"] | null
          concerne?: boolean | null
          desactive?: boolean | null
        }
      }
      usage: {
        Row: {
          fonction: Database["public"]["Enums"]["usage_fonction"]
          action: Database["public"]["Enums"]["usage_action"]
          page: Database["public"]["Enums"]["visite_page"] | null
          user_id: string | null
          collectivite_id: number | null
          time: string
        }
        Insert: {
          fonction: Database["public"]["Enums"]["usage_fonction"]
          action: Database["public"]["Enums"]["usage_action"]
          page?: Database["public"]["Enums"]["visite_page"] | null
          user_id?: string | null
          collectivite_id?: number | null
          time?: string
        }
        Update: {
          fonction?: Database["public"]["Enums"]["usage_fonction"]
          action?: Database["public"]["Enums"]["usage_action"]
          page?: Database["public"]["Enums"]["visite_page"] | null
          user_id?: string | null
          collectivite_id?: number | null
          time?: string
        }
      }
      visite: {
        Row: {
          page: Database["public"]["Enums"]["visite_page"]
          tag: Database["public"]["Enums"]["visite_tag"] | null
          onglet: Database["public"]["Enums"]["visite_onglet"] | null
          user_id: string | null
          collectivite_id: number | null
          time: string
        }
        Insert: {
          page: Database["public"]["Enums"]["visite_page"]
          tag?: Database["public"]["Enums"]["visite_tag"] | null
          onglet?: Database["public"]["Enums"]["visite_onglet"] | null
          user_id?: string | null
          collectivite_id?: number | null
          time?: string
        }
        Update: {
          page?: Database["public"]["Enums"]["visite_page"]
          tag?: Database["public"]["Enums"]["visite_tag"] | null
          onglet?: Database["public"]["Enums"]["visite_onglet"] | null
          user_id?: string | null
          collectivite_id?: number | null
          time?: string
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
          phase: Database["public"]["Enums"]["action_categorie"] | null
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
      action_statuts: {
        Row: {
          collectivite_id: number | null
          action_id: string | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          type: Database["public"]["Enums"]["action_type"] | null
          descendants: unknown[] | null
          ascendants: unknown[] | null
          depth: number | null
          have_children: boolean | null
          identifiant: string | null
          nom: string | null
          description: string | null
          have_exemples: boolean | null
          have_preuve: boolean | null
          have_ressources: boolean | null
          have_reduction_potentiel: boolean | null
          have_perimetre_evaluation: boolean | null
          have_contexte: boolean | null
          phase: Database["public"]["Enums"]["action_categorie"] | null
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
          avancement: Database["public"]["Enums"]["avancement"] | null
          avancement_detaille: number[] | null
          avancement_descendants:
            | Database["public"]["Enums"]["avancement"][]
            | null
          non_concerne: boolean | null
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
      auditeurs: {
        Row: {
          collectivite_id: number | null
          audit_id: number | null
          referentiel: Database["public"]["Enums"]["referentiel"] | null
          noms: Json | null
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
      fiche_action_personne_pilote: {
        Row: {
          collectivite_id: number | null
          nom: string | null
          user_id: string | null
          tag_id: number | null
        }
      }
      fiche_action_personne_referente: {
        Row: {
          collectivite_id: number | null
          nom: string | null
          user_id: string | null
          tag_id: number | null
        }
      }
      fiches_action: {
        Row: {
          modified_at: string | null
          id: number | null
          titre: string | null
          description: string | null
          piliers_eci:
            | Database["public"]["Enums"]["fiche_action_piliers_eci"][]
            | null
          objectifs: string | null
          resultats_attendus:
            | Database["public"]["Enums"]["fiche_action_resultats_attendus"][]
            | null
          cibles: Database["public"]["Enums"]["fiche_action_cibles"][] | null
          ressources: string | null
          financements: string | null
          budget_previsionnel: number | null
          statut: Database["public"]["Enums"]["fiche_action_statuts"] | null
          niveau_priorite:
            | Database["public"]["Enums"]["fiche_action_niveaux_priorite"]
            | null
          date_debut: string | null
          date_fin_provisoire: string | null
          amelioration_continue: boolean | null
          calendrier: string | null
          notes_complementaires: string | null
          maj_termine: boolean | null
          collectivite_id: number | null
          created_at: string | null
          modified_by: string | null
          thematiques: unknown[] | null
          sous_thematiques: unknown[] | null
          partenaires: unknown[] | null
          structures: unknown[] | null
          pilotes: unknown[] | null
          referents: unknown[] | null
          annexes: unknown[] | null
          axes: unknown[] | null
          actions: unknown[] | null
          indicateurs: unknown[] | null
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
      historique_utilisateur: {
        Row: {
          collectivite_id: number | null
          modified_by_id: string | null
          modified_by_nom: string | null
        }
      }
      indicateurs_collectivite: {
        Row: {
          indicateur_id: string | null
          indicateur_personnalise_id: number | null
          nom: string | null
          description: string | null
          unite: string | null
          collectivite_id: number | null
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
      stats_carte_collectivite_active: {
        Row: {
          collectivite_id: number | null
          nom: string | null
          type_collectivite:
            | Database["public"]["Enums"]["type_collectivite"]
            | null
          nature_collectivite: string | null
          code_siren_insee: string | null
          region_name: string | null
          region_code: string | null
          departement_name: string | null
          departement_code: string | null
          population_totale: number | null
          geojson: Json | null
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
      add_compression_policy: {
        Args: {
          hypertable: unknown
          compress_after: unknown
          if_not_exists: boolean
        }
        Returns: number
      }
      add_continuous_aggregate_policy: {
        Args: {
          continuous_aggregate: unknown
          start_offset: unknown
          end_offset: unknown
          schedule_interval: unknown
          if_not_exists: boolean
        }
        Returns: number
      }
      add_data_node: {
        Args: {
          node_name: unknown
          host: string
          database: unknown
          port: number
          if_not_exists: boolean
          bootstrap: boolean
          password: string
        }
        Returns: Record<string, unknown>[]
      }
      add_dimension: {
        Args: {
          hypertable: unknown
          column_name: unknown
          number_partitions: number
          chunk_time_interval: unknown
          partitioning_func: unknown
          if_not_exists: boolean
        }
        Returns: Record<string, unknown>[]
      }
      add_job: {
        Args: {
          proc: unknown
          schedule_interval: unknown
          config: Json
          initial_start: string
          scheduled: boolean
        }
        Returns: number
      }
      add_reorder_policy: {
        Args: {
          hypertable: unknown
          index_name: unknown
          if_not_exists: boolean
        }
        Returns: number
      }
      add_retention_policy: {
        Args: { relation: unknown; drop_after: unknown; if_not_exists: boolean }
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
        Args: { fiche_id: number; action_id: unknown }
        Returns: undefined
      }
      ajouter_annexe: {
        Args: { fiche_id: number; annexe: unknown }
        Returns: unknown
      }
      ajouter_fiche_action_dans_un_axe: {
        Args: { fiche_id: number; axe_id: number }
        Returns: undefined
      }
      ajouter_indicateur: {
        Args: { fiche_id: number; indicateur: unknown }
        Returns: undefined
      }
      ajouter_partenaire: {
        Args: { fiche_id: number; partenaire: unknown }
        Returns: unknown
      }
      ajouter_pilote: {
        Args: { fiche_id: number; pilote: unknown }
        Returns: unknown
      }
      ajouter_referent: {
        Args: { fiche_id: number; referent: unknown }
        Returns: unknown
      }
      ajouter_sous_thematique: {
        Args: { fiche_id: number; thematique_id: number }
        Returns: undefined
      }
      ajouter_structure: {
        Args: { fiche_id: number; structure: unknown }
        Returns: unknown
      }
      ajouter_thematique: {
        Args: { fiche_id: number; thematique: string }
        Returns: undefined
      }
      alter_job: {
        Args: {
          job_id: number
          schedule_interval: unknown
          max_runtime: unknown
          max_retries: number
          retry_period: unknown
          scheduled: boolean
          config: Json
          next_start: string
          if_exists: boolean
        }
        Returns: Record<string, unknown>[]
      }
      approximate_row_count: {
        Args: { relation: unknown }
        Returns: number
      }
      attach_data_node: {
        Args: {
          node_name: unknown
          hypertable: unknown
          if_not_attached: boolean
          repartition: boolean
        }
        Returns: Record<string, unknown>[]
      }
      attach_tablespace: {
        Args: {
          tablespace: unknown
          hypertable: unknown
          if_not_attached: boolean
        }
        Returns: undefined
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
      chunk_compression_stats: {
        Args: { hypertable: unknown }
        Returns: Record<string, unknown>[]
      }
      chunks_detailed_size: {
        Args: { hypertable: unknown }
        Returns: Record<string, unknown>[]
      }
      claim_collectivite: {
        Args: { id: number }
        Returns: Json
      }
      collectivite_membres: {
        Args: { id: number }
        Returns: Record<string, unknown>[]
      }
      compress_chunk: {
        Args: { uncompressed_chunk: unknown; if_not_compressed: boolean }
        Returns: unknown
      }
      consume_invitation: {
        Args: { id: string }
        Returns: undefined
      }
      create_distributed_hypertable: {
        Args: {
          relation: unknown
          time_column_name: unknown
          partitioning_column: unknown
          number_partitions: number
          associated_schema_name: unknown
          associated_table_prefix: unknown
          chunk_time_interval: unknown
          create_default_indexes: boolean
          if_not_exists: boolean
          partitioning_func: unknown
          migrate_data: boolean
          chunk_target_size: string
          chunk_sizing_func: unknown
          time_partitioning_func: unknown
          replication_factor: number
          data_nodes: unknown
        }
        Returns: Record<string, unknown>[]
      }
      create_distributed_restore_point: {
        Args: { name: string }
        Returns: Record<string, unknown>[]
      }
      create_hypertable: {
        Args: {
          relation: unknown
          time_column_name: unknown
          partitioning_column: unknown
          number_partitions: number
          associated_schema_name: unknown
          associated_table_prefix: unknown
          chunk_time_interval: unknown
          create_default_indexes: boolean
          if_not_exists: boolean
          partitioning_func: unknown
          migrate_data: boolean
          chunk_target_size: string
          chunk_sizing_func: unknown
          time_partitioning_func: unknown
          replication_factor: number
          data_nodes: unknown
        }
        Returns: Record<string, unknown>[]
      }
      decompress_chunk: {
        Args: { uncompressed_chunk: unknown; if_compressed: boolean }
        Returns: unknown
      }
      delete_data_node: {
        Args: {
          node_name: unknown
          if_exists: boolean
          force: boolean
          repartition: boolean
          drop_database: boolean
        }
        Returns: boolean
      }
      delete_job: {
        Args: { job_id: number }
        Returns: undefined
      }
      detach_data_node: {
        Args: {
          node_name: unknown
          hypertable: unknown
          if_attached: boolean
          force: boolean
          repartition: boolean
        }
        Returns: number
      }
      detach_tablespace: {
        Args: { tablespace: unknown; hypertable: unknown; if_attached: boolean }
        Returns: number
      }
      detach_tablespaces: {
        Args: { hypertable: unknown }
        Returns: number
      }
      drop_chunks: {
        Args: {
          relation: unknown
          older_than: unknown
          newer_than: unknown
          verbose: boolean
        }
        Returns: string
      }
      enlever_action: {
        Args: { fiche_id: number; action_id: unknown }
        Returns: undefined
      }
      enlever_annexe: {
        Args: { fiche_id: number; annexe: unknown; supprimer: boolean }
        Returns: undefined
      }
      enlever_fiche_action_d_un_axe: {
        Args: { fiche_id: number; axe_id: number }
        Returns: undefined
      }
      enlever_indicateur: {
        Args: { fiche_id: number; indicateur: unknown }
        Returns: undefined
      }
      enlever_partenaire: {
        Args: { fiche_id: number; partenaire: unknown }
        Returns: undefined
      }
      enlever_pilote: {
        Args: { fiche_id: number; pilote: unknown }
        Returns: undefined
      }
      enlever_referent: {
        Args: { fiche_id: number; referent: unknown }
        Returns: undefined
      }
      enlever_sous_thematique: {
        Args: { fiche_id: number; thematique_id: number }
        Returns: undefined
      }
      enlever_structure: {
        Args: { fiche_id: number; structure: unknown }
        Returns: undefined
      }
      enlever_thematique: {
        Args: { fiche_id: number; thematique: string }
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
      get_telemetry_report: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      hypertable_compression_stats: {
        Args: { hypertable: unknown }
        Returns: Record<string, unknown>[]
      }
      hypertable_detailed_size: {
        Args: { hypertable: unknown }
        Returns: Record<string, unknown>[]
      }
      hypertable_index_size: {
        Args: { index_name: unknown }
        Returns: number
      }
      hypertable_size: {
        Args: { hypertable: unknown }
        Returns: number
      }
      interpolate:
        | {
            Args: {
              value: number
              prev: Record<string, unknown>[]
              next: Record<string, unknown>[]
            }
            Returns: number
          }
        | {
            Args: {
              value: number
              prev: Record<string, unknown>[]
              next: Record<string, unknown>[]
            }
            Returns: number
          }
        | {
            Args: {
              value: number
              prev: Record<string, unknown>[]
              next: Record<string, unknown>[]
            }
            Returns: number
          }
        | {
            Args: {
              value: number
              prev: Record<string, unknown>[]
              next: Record<string, unknown>[]
            }
            Returns: number
          }
        | {
            Args: {
              value: number
              prev: Record<string, unknown>[]
              next: Record<string, unknown>[]
            }
            Returns: number
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
      json_matches_schema: {
        Args: { schema: Json; instance: Json }
        Returns: boolean
      }
      jsonb_matches_schema: {
        Args: { schema: Json; instance: Json }
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
      locf: {
        Args: { value: unknown; prev: unknown; treat_null_as_missing: boolean }
        Returns: unknown
      }
      move_chunk: {
        Args: {
          chunk: unknown
          destination_tablespace: unknown
          index_destination_tablespace: unknown
          reorder_index: unknown
          verbose: boolean
        }
        Returns: undefined
      }
      naturalsort: {
        Args: { "": string }
        Returns: string
      }
      personnes_collectivite: {
        Args: { collectivite_id: number }
        Returns: unknown
      }
      peut_modifier_la_fiche: {
        Args: { fiche_id: number }
        Returns: boolean
      }
      plan_action: {
        Args: { id: number }
        Returns: Json
      }
      plans_action_collectivite: {
        Args: { collectivite_id: number }
        Returns: unknown
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
      remove_compression_policy: {
        Args: { hypertable: unknown; if_exists: boolean }
        Returns: boolean
      }
      remove_continuous_aggregate_policy: {
        Args: { continuous_aggregate: unknown; if_not_exists: boolean }
        Returns: undefined
      }
      remove_membre_from_collectivite: {
        Args: { collectivite_id: number; email: string }
        Returns: Json
      }
      remove_reorder_policy: {
        Args: { hypertable: unknown; if_exists: boolean }
        Returns: undefined
      }
      remove_retention_policy: {
        Args: { relation: unknown; if_exists: boolean }
        Returns: undefined
      }
      reorder_chunk: {
        Args: { chunk: unknown; index: unknown; verbose: boolean }
        Returns: undefined
      }
      retool_user_list: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, unknown>[]
      }
      save_reponse: {
        Args: { "": Json }
        Returns: undefined
      }
      set_adaptive_chunking: {
        Args: { hypertable: unknown; chunk_target_size: string }
        Returns: Record<string, unknown>[]
      }
      set_chunk_time_interval: {
        Args: {
          hypertable: unknown
          chunk_time_interval: unknown
          dimension_name: unknown
        }
        Returns: undefined
      }
      set_integer_now_func: {
        Args: {
          hypertable: unknown
          integer_now_func: unknown
          replace_if_exists: boolean
        }
        Returns: undefined
      }
      set_number_partitions: {
        Args: {
          hypertable: unknown
          number_partitions: number
          dimension_name: unknown
        }
        Returns: undefined
      }
      set_replication_factor: {
        Args: { hypertable: unknown; replication_factor: number }
        Returns: undefined
      }
      show_chunks: {
        Args: { relation: unknown; older_than: unknown; newer_than: unknown }
        Returns: unknown
      }
      show_tablespaces: {
        Args: { hypertable: unknown }
        Returns: unknown
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
      test_disable_fake_score_generation: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_enable_fake_score_generation: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_fulfill: {
        Args: { collectivite_id: number; etoile: "1" | "2" | "3" | "4" | "5" }
        Returns: undefined
      }
      test_generate_fake_scores: {
        Args: {
          collectivite_id: number
          referentiel: Database["public"]["Enums"]["referentiel"]
          statuts: unknown
        }
        Returns: Json
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
      test_write_scores: {
        Args: { collectivite_id: number; scores: unknown }
        Returns: undefined
      }
      time_bucket:
        | {
            Args: { bucket_width: unknown; ts: string }
            Returns: string
          }
        | {
            Args: { bucket_width: unknown; ts: string }
            Returns: string
          }
        | {
            Args: { bucket_width: unknown; ts: string }
            Returns: string
          }
        | {
            Args: { bucket_width: unknown; ts: string; origin: string }
            Returns: string
          }
        | {
            Args: { bucket_width: unknown; ts: string; origin: string }
            Returns: string
          }
        | {
            Args: { bucket_width: unknown; ts: string; origin: string }
            Returns: string
          }
        | {
            Args: { bucket_width: number; ts: number }
            Returns: number
          }
        | {
            Args: { bucket_width: number; ts: number }
            Returns: number
          }
        | {
            Args: { bucket_width: number; ts: number }
            Returns: number
          }
        | {
            Args: { bucket_width: number; ts: number; offset: number }
            Returns: number
          }
        | {
            Args: { bucket_width: number; ts: number; offset: number }
            Returns: number
          }
        | {
            Args: { bucket_width: number; ts: number; offset: number }
            Returns: number
          }
        | {
            Args: { bucket_width: unknown; ts: string; offset: unknown }
            Returns: string
          }
        | {
            Args: { bucket_width: unknown; ts: string; offset: unknown }
            Returns: string
          }
        | {
            Args: { bucket_width: unknown; ts: string; offset: unknown }
            Returns: string
          }
      time_bucket_gapfill:
        | {
            Args: {
              bucket_width: unknown
              ts: string
              start: string
              finish: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: number
              ts: number
              start: number
              finish: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
              start: number
              finish: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
              start: number
              finish: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              start: string
              finish: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              start: string
              finish: string
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
      visite_tag:
        | "cae"
        | "eci"
        | "crte"
        | "referentiel"
        | "thematique"
        | "personnalise"
    }
  }
}

