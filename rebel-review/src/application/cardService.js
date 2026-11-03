// validates a card and then creates it 
// also validates before updateCard and deleteCard

import { validateCard, createCard, updateCardContent } from "../domain/card"

export function createCardService(cardRepository){
    return{
       
        async createNewCard(deckId, untrimmedFront, untrimmedBack){
            const result = validateCard(untrimmedFront, untrimmedBack);

            if(!result.valid){
                throw new Error(result.error);
            }
            
            return cardRepository.save(createCard(deckId, result.front, result.back));
        },

        async getCardsByDeck(deckId){
            return cardRepository.getByDeckId(deckId)
        },

        async updateCard(card, untrimmedFront, untrimmedBack){
            const result = validateCard(untrimmedFront, untrimmedBack);

            if(!result.valid){
                throw new Error(result.error);
            }

            return cardRepository.update(updateCardContent(card, result.front, result.back));
        },

        async deleteCard(cardId){
            return cardRepository.delete(cardId);
        }
    };
}