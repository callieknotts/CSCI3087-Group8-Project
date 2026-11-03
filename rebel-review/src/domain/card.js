import { newCardSchedule } from "./scheduler";

export function validateCard(front, back){
    const trimmedFrontOfCard = front.trim();
    const trimmedBackOfCard = back.trim();

    if(trimmedFrontOfCard === ''){
        return {valid: false, error: 'Front of the card cannot be empty.'};
    }
    if(trimmedBackOfCard === ''){
        return {valid: false, error: 'Back of the card cannot be empty.'}
    }
    return {valid: true, front: trimmedFrontOfCard, back: trimmedBackOfCard}

}

export function createCard(deckId, front, back, now= new Date()){
    return {
        deck_id: deckId,
        front,
        back,
        ...newCardSchedule(now)
    }
}
// Returns a copy of the card with new front/back text. Everything else (id, deck, schedule) 
// stays the same. So changing a card's text never resets its review schedule or moves it 
// to another deck.
export function updateCardContent(card, front, back){
    return {
        ...card,
        front,
        back
    }
}