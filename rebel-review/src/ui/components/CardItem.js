// one card row with Edit and Delete buttons. Edit turns
// the row into two inputs with Save and Cancel and Delete 
// asks for confirmation first

import { useState } from "react";

function CardItem({ card, cardService, onCardUpdated, onCardDeleted }) {
    const [editing, setEditing] = useState(false);
    const [front, setFront] = useState(card.front);
    const [back, setBack] = useState(card.back);
    const [error, setError] = useState('');

    async function handleSave() {
        try {
            const updated = await cardService.updateCard(card, front, back);
            onCardUpdated(updated);
            setEditing(false);
            setError('');
        }
        catch (e) {
            setError(e.message);
        }
    }

    async function handleDelete() {
        if (!window.confirm('Delete this card? This cannot be undone.')) {
            return;
        }
        try {
            await cardService.deleteCard(card.id);
            onCardDeleted(card.id);
        }
        catch (e) {
            setError(e.message);
        }
    }

    function handleCancel() {
        setFront(card.front);
        setBack(card.back);
        setError('');
        setEditing(false);
    }

    if (editing) {
        return (
            <li>
                <input type="text" value={front} onChange={(e) => setFront(e.target.value)} />
                <input type="text" value={back} onChange={(e) => setBack(e.target.value)} />
                <button onClick={handleSave}>Save</button>
                <button onClick={handleCancel}>Cancel</button>
                {error && <p>{error}</p>}
            </li>
        );
    }

    return (
        <li>
            {card.front} → {card.back}
            <button onClick={() => setEditing(true)}>Edit</button>
            <button onClick={handleDelete}>Delete</button>
            {error && <p>{error}</p>}
        </li>
    );
}

export default CardItem;