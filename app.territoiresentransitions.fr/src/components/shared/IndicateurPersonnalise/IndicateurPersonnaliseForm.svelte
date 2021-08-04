<script lang="ts">
	import { createEventDispatcher, onMount } from "svelte"
	import { IndicateurPersonnaliseStorable } from "$storables/IndicateurPersonnaliseStorable"
	import LabeledTextInput from "../Forms/LabeledTextInput.svelte"
	import LabeledTextArea from "../Forms/LabeledTextArea.svelte"
	import { getCurrentEpciId } from "$api/currentEpci"
	import { indicateurPersonnaliseStore } from "$api/hybridStores"

	export let indicateurUid: string

	let epci_id = ""
	let custom_id = ""
	let description = ""
	let nom = ""
	let unite = ""
	let commentaire = ""

	const dispatch = createEventDispatcher()

	const handleSave = async () => {
		if (!nom) return

		const indicateur = new IndicateurPersonnaliseStorable({
			uid: indicateurUid,
			epci_id,
			custom_id,
			description,
			nom,
			unite,
			meta: { commentaire }
		})
		const saved = await indicateurPersonnaliseStore.store(indicateur)
		dispatch("save", { indicateur: saved }) // Qui écoute cet évènement ?
	}

	onMount(async () => {
		epci_id = getCurrentEpciId()
		const stored = await indicateurPersonnaliseStore.retrieveAtPath(`${epci_id}/${indicateurUid}`)
		if (stored.length) {
			const indicateurPersonnaliseStorable = stored.length ? stored[0] : undefined
			custom_id = indicateurPersonnaliseStorable.custom_id
			description = indicateurPersonnaliseStorable.description
			nom = indicateurPersonnaliseStorable.nom
			unite = indicateurPersonnaliseStorable.unite
			commentaire = indicateurPersonnaliseStorable.meta.commentaire
		}
	})

</script>

<section>
	<LabeledTextInput bind:value={nom} id="indicateur-personnalise-form-titre" label="Titre" />

	<LabeledTextArea
		bind:value={description}
		id="indicateur-personnalise-form-description"
		label="Description"
	/>

	<LabeledTextInput bind:value={unite} id="indicateur-personnalise-form-unite" label="Unité" />
	<!-- Note: Property 'commentaire' does not exist on type 'object'. -->
	<!-- Suggestion #1 (quicker) : `any` instead of `object` -->
	<!-- Suggestion #2 (better - I think - ) : Define the field interface with type IndicateurMeta = {commentaire?: string} but save in DB meta as a JSON field -->
	<LabeledTextArea
		bind:value={commentaire}
		id="indicateur-personnalise-form-commentaire"
		label="Commentaire"
	/>
	<button class="fr-btn fr-btn--secondary" on:click|preventDefault={handleSave}>
		Enregister
	</button>
</section>

<style>
	section :global(fieldset) {
		max-width: 100%;
		margin-bottom: 3rem;
		padding: 0;
		border: none;
	}
</style>
