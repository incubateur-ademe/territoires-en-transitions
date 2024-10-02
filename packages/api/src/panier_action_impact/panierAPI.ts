import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../database.types';
import { MesCollectivite, Panier, PanierBase } from './types';

/**
 * On sélectionne toutes les colonnes du panier : *
 * puis les `action_impact` par la relation `action_impact_state` que l'on renomme `states`
 */
export const panierSelect = `*,states:action_impact_state(
    *, matches_competences,
    thematiques:action_impact_thematique(...thematique(id,nom)),
    typologie:action_impact_typologie(*),
    fourchette_budgetaire:action_impact_fourchette_budgetaire(*),
    temps_de_mise_en_oeuvre:action_impact_temps_de_mise_en_oeuvre(*),
    actions_liees:action_definition(identifiant,referentiel,nom)
)`;

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
    const {data, error} =
      collectivite_id === null
        ? await this.supabase.rpc('panier_from_landing')
        : await this.supabase.rpc('panier_from_landing', { collectivite_id });

    if (error) throw error;
    return data as PanierBase;
  }

  listenToPanierUpdates(
    panier_id: string,
    onChange: (
      payload: RealtimePayload<Database['public']['Tables']['panier']['Row']>
    ) => void
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
        action_id: action_id,
        panier_id: panier_id,
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
    thematique_ids,
    typologie_ids,
    niveau_budget_ids,
    niveau_temps_ids,
  }: {
    panierId: string;
    thematique_ids: number[];
    typologie_ids: number[];
    niveau_budget_ids: number[];
    niveau_temps_ids: number[];
  }): Promise<Panier | null> {
    const builder = this.supabase
      .from('panier')
      .select(panierSelect)
      .eq('id', panierId);

    if (thematique_ids && thematique_ids.length > 0) {
      // @ts-expect-error Le client Supabase ne permet pas de filtrer à ce niveau
      builder.url.searchParams.append(
        'action_impact_state.thematiques.thematique_id',
        `in.(${thematique_ids.join(',')})`
      );
      // @ts-expect-error Le client Supabase ne permet pas de filtrer à ce niveau
      builder.url.searchParams.append(
        'action_impact_state.thematiques',
        'not.is.null'
      );
    }

    if (typologie_ids && typologie_ids.length > 0) {
      // @ts-expect-error Le client Supabase ne permet pas de filtrer à ce niveau
      builder.url.searchParams.append(
        'action_impact_state.typologie.id',
        `in.(${typologie_ids.join(',')})`
      );
      // @ts-expect-error Le client Supabase ne permet pas de filtrer à ce niveau
      builder.url.searchParams.append(
        'action_impact_state.typologie',
        'not.is.null'
      );
    }

    if (niveau_budget_ids && niveau_budget_ids.length > 0) {
      // @ts-expect-error Le client Supabase ne permet pas de filtrer à ce niveau
      builder.url.searchParams.append(
        'action_impact_state.fourchette_budgetaire.niveau',
        `in.(${niveau_budget_ids.join(',')})`
      );
      // @ts-expect-error Le client Supabase ne permet pas de filtrer à ce niveau
      builder.url.searchParams.append(
        'action_impact_state.fourchette_budgetaire',
        'not.is.null'
      );
    }

    if (niveau_temps_ids && niveau_temps_ids.length > 0) {
      // @ts-expect-error Le client Supabase ne permet pas de filtrer à ce niveau
      builder.url.searchParams.append(
        'action_impact_state.temps_de_mise_en_oeuvre.niveau',
        `in.(${niveau_temps_ids.join(',')})`
      );
      // @ts-expect-error Le client Supabase ne permet pas de filtrer à ce niveau
      builder.url.searchParams.append(
        'action_impact_state.temps_de_mise_en_oeuvre',
        'not.is.null'
      );
    }

    const {data, error} = await builder.single<Panier>();
    if (error) throw error;
    return this.ajouteActionsDejaImportees(data);
  }

  /**
   * Renvoi l'id du panier d'une collectivité et le nombre d'actions de celui-ci
   */
  async getCollectivitePanierInfo(collectivite_id: number) {
    const {data, error} = await this.supabase
      .from('panier')
      .select('id,actions:action_impact_state(isinpanier)')
      .or(
        `collectivite_id.eq.${collectivite_id},collectivite_preset.eq.${collectivite_id}`
      )
      .is('action_impact_state.isinpanier', true);
    if (error) throw error;
    return data?.[0]
      ? {panierId: data[0].id, count: data[0].actions?.length ?? 0}
      : null;
  }

  /**
   * Ajoute aux items du tableau `states` un nouveau flag `dejaImportee`
   * si une action à impact est liée à une fiche action de la collectivité.
   */
  async ajouteActionsDejaImportees(panier: Panier) {
    const collectiviteId =
      panier?.collectivite_id ?? panier?.collectivite_preset;
    if (!collectiviteId) {
      return panier;
    }

    const {data, error} = await this.supabase
      .from('fiche_action')
      .select('action_impact_fiche_action!inner(action_impact_id)')
      .eq('collectivite_id', collectiviteId);
    if (error) throw error;
    const actionsDejaImportees = data?.flatMap(row =>
      row.action_impact_fiche_action.map(action => action.action_impact_id)
    );
    if (!actionsDejaImportees?.length) {
      return panier;
    }

    return {
      ...panier,
      states: panier.states?.map(state => ({
        ...state,
        dejaImportee: actionsDejaImportees.includes(state.action.id),
      })),
    };
  }

  /**
   * Crée un plan d'action pour la collectivité à partir d'un panier
   *
   * Renvoi l'id du plan d'action créé.
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
  async mesCollectivites(): Promise<MesCollectivite> {
    const { data, error } = await this.supabase
      .from('mes_collectivites')
      .select('collectivite_id, nom, niveau_acces, est_auditeur')
      .in('niveau_acces', ['admin', 'edition'])
      .returns<MesCollectivite>();
    if (error) throw error;
    return data;
  }
}
