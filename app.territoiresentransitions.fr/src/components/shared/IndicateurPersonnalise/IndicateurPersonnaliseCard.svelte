<script lang="ts">
	import { getCurrentEpciId } from "$api/currentEpci"
	import { indicateurPersonnaliseStore } from "$api/hybridStores"
	import { IndicateurPersonnaliseStorable } from "$storables/IndicateurPersonnaliseStorable"
	import IndicateurGenericCard from "../IndicateurGeneric/IndicateurGenericCard.svelte"
	import IndicateurForm from "./IndicateurPersonnaliseForm.svelte"
	import RowCard from "../RowCard.svelte"

	export let indicateur: IndicateurPersonnaliseStorable

	let editing = false
	let epciId = ""

	const retrieveIndicateur = async (): Promise<IndicateurPersonnaliseStorable | undefined > => {
		const indicateurValues = await indicateurPersonnaliseStore.retrieveAtPath(
			`${epciId}/${indicateur.uid}` // TODO : This should probably be `id`, like for IndicateurReferentiel
		)
		return indicateurValues.length ? indicateurValues[0]: undefined
	}
	const retrieveDescription = async () => {
		const indicateur = await retrieveIndicateur()
		return indicateur ? indicateur.description : ""
	}
	const retrieveCommentaire = async () => {
		const indicateur = await retrieveIndicateur()
		return indicateur ? indicateur.meta.commentaire : ""
	}
	const saveCommentaire = async (value: string) => {
		// Note : here, we're a bit limited because meta is typed as `any` instead of {commentaire: string}
		indicateur.meta.commentaire = value
		await indicateurPersonnaliseStore.store(indicateur)
	}
</script>

{#if editing}
	<RowCard bordered>
		<h5 class="text-lg">Modifier l'indicateur</h5>
		<IndicateurForm
			bind:indicateurUid={indicateur.uid}
			on:save={async () => {
				editing = false
				indicateur.description = await retrieveDescription() // TODO : this would not be necessary if we had this state in our store.

			}}
		/>
	</RowCard>
{:else}
	<div>
		<button
			class="fr-btn fr-btn--secondary fr-btn--sm fr-fi-edit-fill"
            style="float: right;"
			title="Modifier l'indicateur"
			on:click|preventDefault={ () => {
				editing = true
			}}
		/>
		<IndicateurGenericCard
			indicateurTitle={indicateur.nom}
			indicateurDescription={indicateur.description}
			indicateurId={indicateur.uid}
			{saveCommentaire}
			retrieveCommentaire={retrieveCommentaire}
		/>
	</div>
{/if}
