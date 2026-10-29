import { validateCard, createCard } from "../domain/card"

export function createCardService(cardRepository){
    return{
       
        async createNewCard(deckId, untrimmedFront, untrimmedBack){
            const result = validateCard(untrimmedFront, untrimmedBack);

            if(!result.valid){
                throw new Error(result.error); //error caught: throw new Error(result.error [REMOVED ) before semi-colon]
            }
            
            return cardRepository.save(createCard(deckId, result.front, result.back));
        },

        async getCardsByDeck(deckId){
            return cardRepository.getByDeckId(deckId)
        }
    };
}
