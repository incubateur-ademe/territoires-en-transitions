<script lang="ts">
    /**
     * Allow to use tokens as a way to login for development purposes.
     */
    import Button from "../../../components/shared/Button/Button.svelte";

    let accessToken = ''
    let refreshToken = ''

    const save = async () => {
        const auth = await import("../../../api/authentication")
        auth.saveTokens(accessToken.trim(), refreshToken.trim())
    }
</script>

<div class="flex flex-col">
    <h1 class="text-2xl">Connexion par token</h1>
    <div>
        <a class="text-blue-600"
           href="https://sandbox.territoiresentransitions.fr/auth/signin"
           target="_blank">Se connecter</a>
        puis récupérer les tokens dans les dev tools sur la réponse de l'endpoint
        <pre>v2/auth/token</pre> ou depuis localstorage.
    </div>
    <div class="pb-5"></div>

    <h2 class="text-xl">Access Token</h2>
    <textarea bind:value={accessToken} class="w-full" rows="10"></textarea>
    <div class="pb-5"></div>

    <h2 class="text-xl">Refresh Token</h2>
    <textarea bind:value={refreshToken} class="w-full" rows="10"></textarea>
    <div class="pb-5"></div>

    <Button on:click={save}>Se connecter</Button>
    <div class="pb-5"></div>

    <a href="/auth/identity">Identity</a>
</div>



