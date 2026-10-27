// NEEDS TO BE UPDATED TO MATCH ONION ARCHITECTURE

import { useState } from "react";

function CreateCard({cardService, deckId, onCardCreated}){
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [error, setError] = useState('');

    async function handleClick(){
        try{
            const newCard = await cardService.createNewCard(deckId, front, back); //things that are needed to create a card
            onCardCreated(newCard);
            setFront('');
            setBack('');
            setError('');
        }
        catch(e){
            setError(e.message);
        }
    }

    return(
        <div>
            <input 
                type= "text"
                placeholder= "Front"
                value= {front}
                onChange={(e) => setFront(e.target.value)}
            />
            <input 
                type= "text"
                placeholder= "Back"
                value= {back}
                onChange= {(e) => setBack(e.target.value)}
            />
            <button onClick = {handleClick}>Add Card</button>
            {error && <p>{error}</p>}
        </div>
    );

}

export default CreateCard;