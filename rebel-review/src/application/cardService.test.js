// card service test

import { createCardService } from "./cardService";

const storedCard = { id: "c1", deck_id: "d1", front: "Old", back: "Old", state: "Review", interval: 5 };

test("updateCard saves trimmed text and keeps scheduling fields", async () => {
    const update = jest.fn(async (card) => card);
    const service = createCardService({ update });

    const result = await service.updateCard(storedCard, "  New front ", " New back  ");

    expect(update).toHaveBeenCalledWith({ ...storedCard, front: "New front", back: "New back" });
    expect(result.interval).toBe(5);
});

test("updateCard rejects an empty field without touching the repository", async () => {
    const update = jest.fn();
    const service = createCardService({ update });

    await expect(service.updateCard(storedCard, "   ", "Back")).rejects.toThrow("Front of the card cannot be empty.");
    expect(update).not.toHaveBeenCalled();
});

test("deleteCard passes the id to the repository", async () => {
    const del = jest.fn(async (id) => id);
    const service = createCardService({ delete: del });

    await service.deleteCard("c1");

    expect(del).toHaveBeenCalledWith("c1");
});