import {SupabaseClient} from '@supabase/supabase-js';
import {Database} from '../database.types';
import {MesCollectivite, Panier, PanierBase} from './types';

/**
 * On sélectionne toutes les colonnes du panier : *
 * puis les `action_impact` par la relation `action_impact_panier` que l'on renomme `contenuPanier`
 */
export const panierSelect =
  '*,' +
  'contenu:action_impact!action_impact_panier(*,thematiques:thematique(*)),' +
  'states:action_impact_state(' +
  '*,' +
  'thematiques:thematique(*),' +
  'fourchette_budgetaire:action_impact_fourchette_budgetaire(*),' +
  'temps_de_mise_en_oeuvre:action_impact_temps_de_mise_en_oeuvre(*)' +
  ')' +
  ')';

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
    niveau_temps_ids: number[]
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
    return data;
  }

  /**
   * TODO Crée un plan d'action pour la collectivité à partir d'un panier
   *
   * Renvoi l'id du plan d'action créé.
   *
   * On pourra alors rediriger l'utilisateur vers :
   * https://app.territoiresentransitions.fr/collectivite/[collectivite_id]/plans/plan/[plan_id]
   *
   * @param collectivite_id
   * @param panier_id
   */
  async createPlanFromPanier(
    collectivite_id: number,
    panier_id: string
  ): Promise<number> {
    // todo appeler la RPC plan_from_panier(collectivite_id, panier_id)
    throw 'pas encore implémenté';
  }

  /**
   * La liste des collectivités dans lesquelles on peut
   * créer un plan à partir d'un panier.
   */
  async mesCollectivites(): Promise<MesCollectivite> {
    const {data, error} = await this.supabase
      .from('mes_collectivites')
      .select('collectivite_id, nom, niveau_acces, est_auditeur')
      .in('niveau_acces', ['admin', 'edition'])
      .returns<MesCollectivite>();
    if (error) throw error;
    return data;
  }
}
