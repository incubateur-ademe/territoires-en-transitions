<script context="module">
    export async function preload(page, session) {
        const code = page.query['code']
        return {code}
    }
</script>

<script>
    import {onMount} from "svelte";
    import {getCurrentAPI} from "../../../api/currentAPI";

    export let code
    let accessToken = ''

    onMount(async () => {
        const api = getCurrentAPI()
        const endpoint = `${api}/v2/auth/token`

        const response = await fetch(`${endpoint}?code=${code}`)
        const token = await  response.json()
        accessToken = token['access_token']
    })
</script>

<h1>code</h1>
<textarea class="w-full" rows="2">{code}</textarea>

<h2>access token</h2>
<textarea class="w-full" rows="10">{accessToken}</textarea>
