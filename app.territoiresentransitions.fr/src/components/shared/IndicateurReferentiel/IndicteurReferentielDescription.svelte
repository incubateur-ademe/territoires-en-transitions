<script lang="ts">
	/**
	 * Displays an indicateur an its yearly values.
	 */
	import type { IndicateurReferentiel } from "$generated/models/indicateur_referentiel"
	import { onMount } from "svelte"
	import type { ActionReferentiel } from "$generated/models/action_referentiel"
	import { getCurrentEpciId } from "$api/currentEpci"

	export let indicateur: IndicateurReferentiel
	let relatedActions: ActionReferentiel[] = []
	let epciId = ""

	onMount(async () => {
		epciId = getCurrentEpciId()
		const referentiel = await import("$generated/data/actions_referentiels")

		const found: ActionReferentiel[] = []
		for (let actionId of indicateur.action_ids) {
			const search = (actions: ActionReferentiel[], id: string) => {
				for (let action of actions) {
					if (action.id == id) return action
					const found = search(action.actions, id)
					if (found) return found
				}
			}
			const action = search(referentiel.actions, actionId)
			if (action) found.push(action)
		}
		relatedActions = found
	})
</script>

{@html indicateur.description}

{#if relatedActions}
	<div class="fr-text--bold">Actions liées</div>

	<ul>
		{#each relatedActions as action}
			<li>
				<a
					href="/actions_referentiels/{action.id}/?epci_id={epciId}#{action.id}"
					class="fr-link fr-fi-arrow-right-line fr-link--icon-right"
					rel="prefetch"
				>
					{action.id_nomenclature} -
					{action.nom}
				</a>
			</li>
		{/each}
	</ul>
{/if}

