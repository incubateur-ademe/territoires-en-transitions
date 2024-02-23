import {SupabaseClient} from '@supabase/supabase-js';
import {Database} from '../database.types';
import {Panier, PanierBase} from './types';

/**
 * On sélectionne toutes les colonnes du panier : *
 * puis les `action_impact` par la relation `action_impact_panier` que l'on renomme `contenuPanier`
 */
export const panierSelect =
  '*,contenu:action_impact!action_impact_panier(*,thematiques:thematique(*)),states:action_impact_state(*,matches_competences,thematiques:thematique(*),fourchette_budgetaire:action_impact_fourchette_budgetaire(*)))';

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

  async panierFromLanding(collectivite_id?: number): Promise<PanierBase> {
    const {data, error} =
      collectivite_id === undefined
        ? await this.supabase.rpc('panier_from_landing')
        : await this.supabase.rpc('panier_from_landing', {collectivite_id});

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
        // @ts-ignore: Le typage Supabase à un souci.
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

  async fetchPanier(
    panier_id: string,
    thematique_ids: number[],
    niveau_budget_ids: number[],
    match_competences: boolean
  ): Promise<Panier | null> {
    const builder = this.supabase
      .from('panier')
      .select(panierSelect)
      .eq('id', panier_id);

    if (thematique_ids && thematique_ids.length > 0) {
      // @ts-expect-error Le client Supabase ne permet pas de filtrer à ce niveau
      builder.url.searchParams.append(
        'action_impact_state.thematiques.id',
        `in.(${thematique_ids.join(',')})`
      );
      // @ts-expect-error Le client Supabase ne permet pas de filtrer à ce niveau
      builder.url.searchParams.append(
        'action_impact_state.thematiques',
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

    if (match_competences) {
      // @ts-expect-error Le client Supabase ne permet pas de filtrer à ce niveau
      builder.url.searchParams.append(
        'action_impact_state.matches_competences',
        'is.true'
      );
    }

    const {data, error} = await builder.single<Panier>();
    if (error) throw error;
    return data;
  }
}
