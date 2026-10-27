import { createDeckService } from "./deckService";

test("rejects an empty deck name", async () => {
  const save = jest.fn();
  const service = createDeckService({ save });

  await expect(service.createNewDeck("   ")).rejects.toThrow();
  expect(save).not.toHaveBeenCalled();
});

test("saves a trimmed deck", async () => {
  const save = jest.fn(async (deck) => ({ id: 1, ...deck }));
  const service = createDeckService({ save });

  const deck = await service.createNewDeck("  Biology  ");
  expect(save).toHaveBeenCalledWith({ name: "Biology", cards: [] });
  expect(deck.name).toBe("Biology");
});