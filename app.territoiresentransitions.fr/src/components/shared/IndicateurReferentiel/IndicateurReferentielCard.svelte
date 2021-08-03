<script lang="ts">
	import { onMount } from "svelte"
	import type { IndicateurReferentiel } from "$generated/models/indicateur_referentiel"
	import type { ActionReferentiel } from "$generated/models/action_referentiel"
	import { getCurrentEpciId } from "$api/currentEpci"
	import { IndicateurReferentielCommentaireStorable } from "$storables/IndicateurReferentielCommentaireStorable"
	import { indicateurReferentielCommentaireStore, indicateurValueStore } from "$api/hybridStores"
	import IndicateurReferentielDescription from "./IndicteurReferentielDescription.svelte"
	import IndicateurGenericCard from "../IndicateurGeneric/IndicateurGenericCard.svelte"


	export let indicateur: IndicateurReferentiel // Pourquoi IndicateurReferentiel ici, et IndicateurPersonnaliseStorable dans l'autre ?
	let relatedActions: ActionReferentiel[] = []
	const epciId = getCurrentEpciId()

	const prettifyId = (id: string) => {
		return id.replace("cae-", "").replace("eci-", "").replace(" 0", "")
	}

	const indicateurTitle = `${prettifyId(indicateur.id)} ${indicateur.nom}`
	const retrieveCommentaire = async () => {
		const indicateurValues = await indicateurReferentielCommentaireStore.retrieveAtPath(
			`${epciId}/${indicateur.id}`
		)
		return indicateurValues.length ? indicateurValues[0].value : "" // we should have one value, although the API returns a list. // TODO: Should we change this ?
	}
	const saveCommentaire = async (value: string) => {
		const indicateurReferentielCommentaireStorable = new IndicateurReferentielCommentaireStorable({
			epci_id: epciId,
			indicateur_id: indicateur.id,
			value
		})
		await indicateurReferentielCommentaireStore.store(indicateurReferentielCommentaireStorable)
	}

	onMount(async () => {
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

<IndicateurGenericCard
	indicateurTitle={indicateurTitle}
	indicateurId={indicateur.id}
	{saveCommentaire}
	{retrieveCommentaire}
>
<IndicateurReferentielDescription indicateur={indicateur} slot="description"/>
</IndicateurGenericCard>
