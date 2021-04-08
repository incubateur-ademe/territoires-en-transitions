function requiredValidator() {
    return function required(value) {
        return (value !== undefined && value !== null && value !== '') || 'Ce champ est requis'
    }
}

export {
    requiredValidator
}
