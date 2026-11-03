// local card repository test

import { localCardRepository } from "./localCardRepository";

let counter = 0;
beforeEach(() => {
    localStorage.clear();
    counter = 0;
    Object.defineProperty(global, "crypto", { value: { randomUUID: () => `id-${++counter}` }, configurable: true });
});

// wrapper so the linter does not mistake our getByDeckId for a testing-library query
const cardsIn = (deckId) => localCardRepository.getByDeckId(deckId);

async function addCard(deckId, front) {
    return localCardRepository.save({ deck_id: deckId, front, back: "b", state: "New", interval: 0 });
}

test("update changes the stored card and returns it", async () => {
    const card = await addCard("d1", "Old");
    const updated = await localCardRepository.update({ ...card, front: "New" });

    expect(updated.front).toBe("New");
    expect((await cardsIn("d1"))[0].front).toBe("New");
});

test("update can never move a card to another deck", async () => {
    const card = await addCard("d1", "Old");
    await localCardRepository.update({ ...card, deck_id: "someone-elses-deck" });

    expect(await cardsIn("someone-elses-deck")).toEqual([]);
    expect(await cardsIn("d1")).toHaveLength(1);
});

test("update throws for a card that does not exist", async () => {
    await expect(localCardRepository.update({ id: "missing", front: "x" })).rejects.toThrow("Card not found.");
});

test("delete removes only that card", async () => {
    const a = await addCard("d1", "A");
    await addCard("d1", "B");

    await localCardRepository.delete(a.id);

    const remaining = await cardsIn("d1");
    expect(remaining.map((c) => c.front)).toEqual(["B"]);
});

test("delete throws for a card that does not exist", async () => {
    await expect(localCardRepository.delete("missing")).rejects.toThrow("Card not found.");
});