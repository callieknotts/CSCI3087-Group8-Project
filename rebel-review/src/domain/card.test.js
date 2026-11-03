// card test

import { validateCard, createCard, updateCardContent } from "./card";

const NOW = new Date("2026-01-01T12:00:00.000Z");

test("validateCard trims both sides", () => {
    expect(validateCard("  Front  ", "  Back ")).toEqual({ valid: true, front: "Front", back: "Back" });
});

test("validateCard rejects an empty front or back", () => {
    expect(validateCard("   ", "Back").valid).toBe(false);
    expect(validateCard("Front", "").valid).toBe(false);
});

test("createCard starts as a New card that is due now", () => {
    const card = createCard("deck-1", "Front", "Back", NOW);
    expect(card).toMatchObject({ deck_id: "deck-1", front: "Front", back: "Back", state: "New", interval: 0 });
    expect(card.due_at).toBe(NOW.toISOString());
});

test("updateCardContent changes only the text and keeps the schedule", () => {
    const original = { id: "c1", deck_id: "d1", front: "Old", back: "Old", state: "Review", interval: 10, due_at: "2026-02-01T00:00:00.000Z" };
    const updated = updateCardContent(original, "New front", "New back");
    expect(updated).toEqual({ ...original, front: "New front", back: "New back" });
    expect(original.front).toBe("Old"); // original is not mutated
});