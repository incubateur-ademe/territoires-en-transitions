export const debug = (message) => {
    const hostname = window ? window.location.hostname : ''
    console.log('%c %s', 'color: grey', `>> DEBUG ${hostname}: ${message}`)
}
