// AI GENERATED CODE
import { validateDeckName, createDeck } from "../domain/deck";

export function createDeckService(deckRepository) {
  return {
    async createNewDeck(untrimmedDeckName) {
      const result = validateDeckName(untrimmedDeckName);
      if (!result.valid) {
        throw new Error(result.error);
      }
      return deckRepository.save(createDeck(result.name));
    },
 
    // method added to run app without backend
    async getAllDecks() {
      return deckRepository.getAll();
    },
  };
}