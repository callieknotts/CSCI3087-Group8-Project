export function validateDeckName(name){
    const trimmedDeckName = name.trim();

    if(trimmedDeckName === ''){
        return{valid: false, error: 'Deck name cannot be empty. Please enter a deck name.'};
    }
    return{valid: true, name: trimmedDeckName};
}

export function createDeck(name){
    return{name, cards: []};
}