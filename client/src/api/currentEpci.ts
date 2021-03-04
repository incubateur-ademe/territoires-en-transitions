export const getCurrentEpciId = (): string => {
    const urlParams = new URLSearchParams(window.location.search)
    const id = urlParams.get('epci_id')

    if (!id) {
        throw new Error('Parameter epci_id is empty.')
    }

    return id
}