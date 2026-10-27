//AI GENERATED CODE
import { createCardService } from "./application/cardService";
import { createDeckService } from "./application/deckService";
import { localCardRepository } from "./infrastructure/localCardRepository";
import { localDeckRepository } from "./infrastructure/localDeckRepository";

export const deckService = createDeckService(localDeckRepository);
export const cardService = createCardService(localCardRepository);