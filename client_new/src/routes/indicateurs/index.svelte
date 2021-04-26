<script lang="ts">
    import {IndicateurReferentiel} from "../../../generated/models/indicateur_referentiel";
    import {indicateurs} from "../../../generated/data/indicateurs_referentiels";
    import IndicateurReferentielCard from "../../components/shared/IndicateurReferentielCard.svelte";

    let allIndicateurs: IndicateurReferentiel[] = indicateurs
</script>

{#each indicateurs as indicateur}
    <IndicateurReferentielCard indicateur={indicateur}/>
{/each}