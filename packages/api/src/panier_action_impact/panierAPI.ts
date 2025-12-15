import { SupabaseClient } from '@supabase/supabase-js';
import { CollectiviteAccess } from '@tet/domain/users';
import { toCollectiviteAccess } from '../collectivites/fetch-current-collectivite';
import { Database } from '../typeUtils';
import {
  ActionImpactDetails,
  ActionImpactFull,
  ActionImpactStatut,
  FiltreAction,
  Panier,
  PanierBase,
} from './types';

type RealtimePayload<T> = {
  type: string;
  schema: string;
  table: string;
  commit_timestamp: string;
  errors: string[];
  new: T;
  old: Partial<T>;
};

export class PanierAPI {
  protected supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  async panierFromLanding(collectivite_id: number | null): Promise<PanierBase> {
    const { data, error } =
      collectivite_id === null
        ? await this.supabase.rpc('panier_from_landing')
        : await this.supabase.rpc('panier_from_landing', { collectivite_id });

    if (error) throw error;
    return data as PanierBase;
  }

  listenToPanierUpdates(
    panier_id: string,
    onChange: (payload: RealtimePayload<PanierBase>) => void
  ) {
    return this.supabase
      .channel('realtime panier')
      .on(
        // @ts-expect-error: Le typage Supabase à un souci.
        // Typer avec en important `@supabase/realtime-js` pour y remédier fait planter webpack.
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'panier',
          filter: `id=eq.${panier_id}`,
        },
        onChange
      )
      .subscribe();
  }

  async addActionToPanier(action_id: number, panier_id: string): Promise<void> {
    await this.supabase.from('action_impact_panier').insert({
      action_id: action_id,
      panier_id: panier_id,
    });
  }

  async removeActionFromPanier(
    action_id: number,
    panier_id: string
  ): Promise<void> {
    await this.supabase
      .from('action_impact_panier')
      .delete()
      .eq('action_id', action_id)
      .eq('panier_id', panier_id);
  }

  async setActionStatut(
    action_id: number,
    panier_id: string,
    category_id: string | null
  ): Promise<void> {
    if (category_id) {
      await this.supabase.from('action_impact_statut').upsert({
        action_id,
        panier_id,
        categorie_id: category_id,
      });
    } else {
      await this.supabase
        .from('action_impact_statut')
        .delete()
        .eq('action_id', action_id)
        .eq('panier_id', panier_id);
    }
  }

  async fetchPanier({
    panierId,
    filtre,
  }: {
    panierId: string;
    filtre: FiltreAction;
  }): Promise<Panier | null> {
    const { data, error } = await this.supabase
      .from('panier')
      .select(
        `*,
        etatActions:action_impact_state!inner(
          id: action->>id,
          statut: statut->>categorie_id,
          isinpanier,
          matches_competences
        )`
      )
      .eq('id', panierId)
      .single();
    if (error) throw error;

    // charge toutes les actions par id
    const actionsDetail = await this.getActionsImpact();

    // charge les ID des actions déjà importées
    const actionsDejaImportees = await this.getActionsDejaImportees(
      data?.collectivite_id ?? data?.collectivite_preset
    );

    // ajoute les flags d'état à chaque action
    const actions = actionsDetail?.map((action) => {
      const etat = data?.etatActions?.find(
        // la relation calculée caste en string le champ `action_impact_state(action->>id)`
        // il faut donc caster aussi pour la faire la comparaison
        (etat) => etat.id === String(action.id)
      );
      const { statut, isinpanier, matches_competences } = etat || {};
      return {
        ...action,
        statut: statut as ActionImpactStatut,
        isinpanier: isinpanier ?? false,
        matches_competences: matches_competences ?? false,
        dejaImportee: actionsDejaImportees?.includes(action.id),
      };
    });

    return {
      ...data,
      //      actions,
      selection: this.applyFilters(filtre, actions),
      realise: actions.filter((action) => action.statut === 'realise'),
      en_cours: actions.filter((action) => action.statut === 'en_cours'),
      importees: actions.filter((action) => action.dejaImportee),
      inpanier: actions.filter((action) => action.isinpanier),
    };
  }

  /**
   * Applique les options de filtrage
   */
  applyFilters(filtre: FiltreAction, actions: ActionImpactFull[]) {
    if (!filtre) return actions;
    const {
      thematique_ids,
      typologie_ids,
      niveau_budget_ids,
      niveau_temps_ids,
      matches_competences,
    } = filtre;

    return actions?.filter((action) => {
      if (
        action.dejaImportee ||
        action.isinpanier ||
        action.statut === 'en_cours' ||
        action.statut === 'realise'
      ) {
        return false;
      }

      if (matches_competences && action.matches_competences === false) {
        return false;
      }

      if (thematique_ids?.length) {
        const thematiques = action.thematiques.map((t) => t.id);
        if (!thematique_ids.find((id) => thematiques.includes(id))) {
          return false;
        }
      }

      if (
        typologie_ids?.length &&
        action.typologie_id &&
        !typologie_ids.includes(action.typologie_id)
      ) {
        return false;
      }

      if (
        niveau_budget_ids?.length &&
        action.fourchette_budgetaire &&
        !niveau_budget_ids.includes(action.fourchette_budgetaire.niveau)
      ) {
        return false;
      }

      if (
        niveau_temps_ids?.length &&
        action.temps_de_mise_en_oeuvre &&
        !niveau_temps_ids.includes(action.temps_de_mise_en_oeuvre.niveau)
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Renvoi le détail de toutes les actions à impact
   */
  async getActionsImpact() {
    const { data, error } = await this.supabase
      .from('action_impact')
      .select(
        `*,
          thematiques:action_impact_thematique(...thematique(id,nom),ordre),
          typologie:action_impact_typologie(*),
          fourchette_budgetaire:action_impact_fourchette_budgetaire(*),
          temps_de_mise_en_oeuvre:action_impact_temps_de_mise_en_oeuvre(*),
          actions_liees:action_definition(identifiant,referentiel,nom)
      `
      )
      .returns<ActionImpactDetails[]>();

    if (error) throw error;
    return data?.map((action) => ({
      ...action,
      thematiques: action?.thematiques?.sort((a, b) => a.ordre - b.ordre),
    }));
  }

  /**
   * Renvoi l'id du panier d'une collectivité et le nombre d'actions de celui-ci
   */
  async getCollectivitePanierInfo(collectivite_id: number) {
    const { data, error } = await this.supabase
      .from('panier')
      .select('id,actions:action_impact_state(isinpanier)')
      .or(
        `collectivite_id.eq.${collectivite_id},collectivite_preset.eq.${collectivite_id}`
      )
      .is('action_impact_state.isinpanier', true);
    if (error) throw error;
    return data?.[0]
      ? { panierId: data[0].id, count: data[0].actions?.length ?? 0 }
      : null;
  }

  /**
   * Charge la liste des actions déjà importées (faisant partie d'un plan)
   */
  async getActionsDejaImportees(collectiviteId: number | null) {
    if (!collectiviteId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('fiche_action')
      .select('action_impact_fiche_action!inner(action_impact_id)')
      .eq('collectivite_id', collectiviteId);
    if (error) throw error;
    return data?.flatMap((row) =>
      row.action_impact_fiche_action.map((action) => action.action_impact_id)
    );
  }

  /**
   * Crée un plan pour la collectivité à partir d'un panier
   *
   * Renvoi l'id du plan créé.
   *
   * On pourra alors rediriger l'utilisateur vers le plan nouvellement créé.
   *
   * @param collectivite_id
   * @param panier_id
   */
  async createPlanFromPanier(
    collectivite_id: number,
    panier_id: string
  ): Promise<number> {
    const { data, error } = await this.supabase.rpc('plan_from_panier', {
      collectivite_id,
      panier_id,
    });
    if (error) throw error;
    return data;
  }

  /**
   * La liste des collectivités dans lesquelles on peut
   * créer un plan à partir d'un panier.
   */
  async mesCollectivites(): Promise<CollectiviteAccess[]> {
    const { data, error } = await this.supabase
      .from('mes_collectivites')
      .select(
        'collectivite_id, nom, niveau_acces, est_auditeur, access_restreint'
      )
      .in('niveau_acces', ['admin', 'edition']);

    if (error) throw error;

    return data.map(toCollectiviteAccess);
  }
}
