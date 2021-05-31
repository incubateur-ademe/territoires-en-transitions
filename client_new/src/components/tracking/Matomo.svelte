<script context=module>
    /*
        Store Matomo events in a subscribable object.

        For a better performance, we load Matomo script asynchronously. In order to use,
        Matomo Tracker whenever on our application, we set up a queue with the events we want to
        track. When the script of Matomo is loaded, we subscribe to this queue and call Matomo API
        following events that are piled in it.
     */
    import { writable } from 'svelte/store'

    // We only implement methods from Matomo API that we are using on this application.
    // You can check the documentation to add more Tracking API methods:
    // https://developer.matomo.org/api-reference/tracking-javascript.
    const methods = [
        'trackPageView'
    ]
    const eventsMemory = writable([])

    export const matomo = methods
        .map(method => ([method, (...args) => eventsMemory.update(calls => [...calls, [method, args]])]))
        .reduce((acc, [key, value]) => ({...acc, [key]: value}), {})
</script>

<script>
    import { onMount } from 'svelte'
    import { stores } from '@sapper/app'

    let _matomo
    const url = 'https://stats.data.gouv.fr/'
    const siteId = '180'

    $: scriptUrl = `${url}/matomo.js`
    $: trackUrl = `${url}/matomo.php`
    $: tracker = _matomo && _matomo.getTracker(trackUrl, siteId)

    // Install link tracking on all applicable link elements
    $: tracker.enableLinkTracking(true)

    // Loop in the events memory queue
    $: while (tracker && $eventsMemory.length) {

        // Get the name of the method and remove the event from the queue
        const [fnName, args] = $eventsMemory.shift()
        if (tracker[fnName] instanceof Function) {
            // Call Matomo Tracker API method
            tracker[fnName](...args)
        } else {
            throw new Error(
                `${fnName} does not exist on Matomo Tracker API. Please check https://developer.matomo.org/api-reference/tracking-javascript for mor information.`
            )
        }
    }

    // Use Sapper available page stores to track page changes.
    const { page } = stores()
    $: if ($page) matomo.trackPageView()

    onMount(() => {
        matomo.trackPageView()
    })
</script>

<svelte:head>
    <script
            defer
            async
            src={scriptUrl}
            on:load={() => _matomo = window.Matomo}
    ></script>
</svelte:head>