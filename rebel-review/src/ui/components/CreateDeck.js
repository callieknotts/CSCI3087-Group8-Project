import { useState } from "react";


function CreateDeck({ deckService, onDeckCreated }) {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    async function handleClick(){
        try{
            const newDeck = await deckService.createNewDeck(name);
            onDeckCreated(newDeck);
            setName('');
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
                placeholder= "Deck name"
                value= {name}
                onChange= {(e) => setName(e.target.value)}
            />
            <button onClick= {handleClick}>Create Deck</button>
            {error && <p>{error}</p>}
        </div>
    );
}

export default CreateDeck;