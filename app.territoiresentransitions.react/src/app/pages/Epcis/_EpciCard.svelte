<script lang="ts">
  /**
   * Display an Epci in an card
   */
  import type { EpciStorable } from "storables/EpciStorable";

  export let epci: EpciStorable;
  export let writable: boolean = false;

  $: color = writable ? "juniper" : "blueberry";

  const goto = (section: string, epciId: string) => {
    window.location.href = `/${section}/?epci_id=${epciId}`;
  };
</script>

<div>
  <h3 class="fr-h3">{epci.nom}</h3>

  <button
    class="fr-btn fr-btn--secondary fr-btn--sm fr-fi-arrow-right-line fr-btn--icon-right"
    on:click={() => goto("fiches", epci.uid)}
    >Plan d'actions
  </button>

  <button
    class="fr-btn fr-btn--secondary fr-btn--sm fr-fi-arrow-right-line fr-btn--icon-right"
    on:click={() => goto("actions_referentiels", epci.uid)}
    >Référentiels
  </button>

  <button
    class="fr-btn fr-btn--secondary fr-btn--sm fr-fi-arrow-right-line fr-btn--icon-right"
    on:click={() => goto("indicateurs", epci.uid)}
    >Indicateurs
  </button>
</div>

<style>
  div {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1.5rem 1.5rem;
    background-color: var(--beige);
  }

  h3 {
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .fr-btn:not(:first-of-type) {
    margin-top: 1.25rem;
  }
</style>
