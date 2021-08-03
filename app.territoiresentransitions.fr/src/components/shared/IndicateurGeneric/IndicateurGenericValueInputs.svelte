<script lang="ts">
import { indicateurValueStore } from "$api/hybridStores";
import { IndicateurValueStorable } from "$storables/IndicateurValueStorable";

	/**
	 * Displays an indicateur an its yearly values.
	 */
	import IndicateurGenericValueInput from "./IndicateurGenericValueInput.svelte"

	export let minYear: number = 2008
	export let numberOfYearsToDisplay: number= 6

	export let indicateurId: string
	export let epciId: string

	const retrieveValueForYear = (year: number) => async () => {
	const indicateurValues = await indicateurValueStore.retrieveAtPath(
			`${epciId}/${indicateurId}/${year}`
		)
		return indicateurValues.length ? indicateurValues[0].value : "" // we should have one value per year, although the API returns a list.
	}
	const saveValueForYear = (year: number) => async (value: string) => {
		const indicateurValue = new IndicateurValueStorable({
			epci_id: epciId,
			indicateur_id: indicateurId,
			year: year,
			value: value
		})
		await indicateurValueStore.store(indicateurValue)
	}
	
	const actualYear = new Date().getFullYear()
	const years = [...Array(actualYear + 1 - minYear).keys()].map(i => minYear + i)

	let cursor = actualYear
	let yearIsDisplayed: (year: number) => boolean
	$: yearIsDisplayed = year => year <= cursor && year > cursor - numberOfYearsToDisplay
</script>

<form class="indicatorRow">
	<div class="indicatorRow__carousel">
		<!-- issue #43
                <button class="fr-btn fr-btn--secondary fr-fi-arrow-left-line" title="Précédent"></button>
                -->
		<button
			on:click|preventDefault={() => {
				if (cursor - numberOfYearsToDisplay >= minYear) cursor -= 1
			}}
			class="indicatorRow__button"
			disabled='{yearIsDisplayed(minYear)}'
		>
			←
		</button>
		<div class="indicatorRow__yearsList">
			{#each years as year}
				{#if yearIsDisplayed(year)}
					<div>
						<IndicateurGenericValueInput retrieveValue={retrieveValueForYear(year)} saveValue={saveValueForYear(year)} {year} />
					</div>
				{/if}
			{/each}
		</div>
		<button
			on:click|preventDefault={() => {
				if (cursor < actualYear) cursor += 1
			}}
			class="indicatorRow__button"
			disabled='{yearIsDisplayed(actualYear)}'
			>→</button
		>
		<!-- issue #43
                <button class="fr-btn fr-btn--secondary fr-fi-arrow-right-line" title="Suivant"></button>
                -->
	</div>

	<!-- hidden until a valid solution is found
            <div class="indicatorRow__target">
                <label for="objectif" class="objectif">
                    Objectif
                    <input class="fr-input"
                        id="objectif"
                        type="text"
                    />
                </label>
            </div>
            -->
</form>

<style>
	.indicatorRow {
		display: flex;
		margin-bottom: 2.5rem;
	}

	.indicatorRow__carousel {
		display: flex;
		align-items: flex-end;
	}

	.indicatorRow__carousel .fr-btn {
		box-shadow: none;
		flex-shrink: 0;

		/* caché tant que non fonctionnel */
		display: none;
	}

	.indicatorRow__yearsList {
		position: relative;
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		grid-column-gap: 1.25rem;
		padding: 0 1.5rem;
	}

	.indicatorRow :global(input) {
		margin-top: 0.5rem;
	}

	/* .indicatorRow__target {
		margin-left: 1.5rem;
	} */

	/* .indicatorRow__target .fr-input {
		box-shadow: inset 0 -2px 0 0 var(--bf500);
	}

	label.objectif {
		font-weight: bold;
	} */

	.indicatorRow__button {
		font-size: 1.2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: var(--bf500);
	}
	.indicatorRow__button:disabled {
		opacity: .4;

	}
</style>
