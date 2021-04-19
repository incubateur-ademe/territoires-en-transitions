<script>
    import NavDev from "../components/shared/NavDev.svelte";
</script>
<style>
    h1 {
        font-size: 2.8em;
        text-transform: uppercase;
        font-weight: 700;
        margin: 0 0 0.5em 0;
    }

    @media (min-width: 480px) {
        h1 {
            font-size: 4em;
        }
    }
</style>

<svelte:head>
    <title>page temporaire</title>
</svelte:head>

<h1>Déploiement en cours</h1>
<div class="hidden">
    <NavDev/>
</div>
