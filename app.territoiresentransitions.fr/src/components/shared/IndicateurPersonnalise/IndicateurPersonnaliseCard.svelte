<script lang="ts">
	import { getCurrentEpciId } from "$api/currentEpci"
	import { indicateurPersonnaliseStore } from "$api/hybridStores"
	import { IndicateurPersonnaliseStorable } from "$storables/IndicateurPersonnaliseStorable"
	import IndicateurGenericCard from "../IndicateurGeneric/IndicateurGenericCard.svelte"
	import IndicateurForm from "./IndicateurPersonnaliseForm.svelte"
	import RowCard from "../RowCard.svelte"

	export let indicateur: IndicateurPersonnaliseStorable

	let editing = false
	const epciId = getCurrentEpciId()

	const retrieveCommentaire = async () => {
		const indicateurValues = await indicateurPersonnaliseStore.retrieveAtPath(
			`${epciId}/${indicateur.uid}` // TODO : This should probably be `id`, like for IndicateurReferentiel
		)
		return indicateurValues.length ? indicateurValues[0].meta.commentaire : ""
	}
	const saveCommentaire = async (value: string) => {
		// Note : here, we're a bit limited because meta is typed as `any` instead of {commentaire: string}
		// Question : I'm still not sure I understand why we use object instead of interfaces here.
		const updatedIndicateur = new IndicateurPersonnaliseStorable({
			...indicateur,
			meta: { commentaire: value }
		})
		await indicateurPersonnaliseStore.store(updatedIndicateur)
	}
</script>

{#if editing}
	<RowCard bordered>
		<h5 class="text-lg">Modifier l'indicateur</h5>
		<IndicateurForm
			bind:data={indicateur}
			on:save={() => {
				editing = false
				console.log("editing: ", editing)
			}}
		/>
	</RowCard>
{:else}
	<div>
		<button
			class="fr-btn fr-btn--secondary fr-btn--sm fr-fi-edit-fill"
            style="float: right;"
			title="Modifier l'indicateur"
			on:click|preventDefault={() => {
				editing = true
			}}
		/>
		<IndicateurGenericCard
			indicateurTitle={indicateur.nom}
			indicateurDescription={indicateur.description}
			indicateurId={indicateur.uid}
			{saveCommentaire}
			{retrieveCommentaire}
		/>
	</div>
{/if}
