<script lang="ts">
	import IndicateurGenericCommentaire from "./IndicateurGenericCommentaire.svelte"
	import RowCard from "../RowCard.svelte"
	import ExpandPanel from "$components/ExpandPanel.svelte"
	import IndicateurGenericValueInputs from "./IndicateurGenericValueInputs.svelte"
	import { getCurrentEpciId } from "$api/currentEpci"
	import { onMount } from "svelte";

	export let indicateurId: string
	export let indicateurTitle: string
	export let indicateurDescription: string | undefined = undefined

	export let retrieveCommentaire: () => Promise<string>
	export let saveCommentaire: (value: string) => Promise<void>

	let epciId = ""

	onMount(() => {
		epciId = getCurrentEpciId()
	})
</script>

<RowCard bordered>
	<div class="RowCard__title">
		<div>
			<h3 class="fr-h3">
				{indicateurTitle}
			</h3>
			<div>
				<IndicateurGenericValueInputs epciId={epciId} {indicateurId} />
			</div>
		</div>
	</div>
	<div class="indicator__commentaire_description">
		<ExpandPanel>
			<h3 slot="title">Description</h3>

			<div slot="content">
				<slot name="description">
					{@html indicateurDescription}
				</slot>
			</div>
		</ExpandPanel>
		<ExpandPanel>
			<h3 slot="title">Commentaire</h3>
			<IndicateurGenericCommentaire {retrieveCommentaire} {saveCommentaire} slot="content" />
		</ExpandPanel>
	</div>
</RowCard>

<style>
	.RowCard__title {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	/* .indicator__commentaire_description :global(details) {
		width: 70% !important;
	}

	.indicator :global(summary) {
		align-items: baseline;
	}

	.indicator :global(details[open]) {
		font-weight: inherit;
	} */
</style>
