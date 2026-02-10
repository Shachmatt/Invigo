import React from "react";
import "./conversation.css"; 
import Rive from '@rive-app/react-canvas';

// 1. OPRAVA CEST: Pokud jsou soubory v /public, stačí lomítko na začátku.
// Neimportuj je jako proměnné, v Rive src se používají jako stringy.
const medvedSrc = "/riváček.riv"; 
const holkaSrc = "/holčička.riv";
const bykSrc = "/úplně_konečný_býk.riv"; 
// Pokud nemáš fallback, použij třeba medvěda
const unknownSrc = "/riváček.riv"; 

function Conversation({ people = [], messages = [], data, onAnswered}) {

  const rawPeople = people || (data && data.people) || [];
  const rawMessages = messages || (data && data.messages) || [];
  
  console.log("Conversation Data:", { rawPeople, rawMessages });

  // 2. OPRAVA STRUKTURY: Mapujeme klíč rovnou na objekt s cestou A jménem
  const characterMap = {
    "medved": { src: medvedSrc, name: "Pan Méďa" },
    "holka":  { src: holkaSrc, name: "Anna" },
    "byk":    { src: bykSrc, name: "Pan Býk" },
  };

  const getPersonData = (typeString) => {
    if (!typeString) return { src: unknownSrc, name: "Neznámý" };
    
    const key = typeString.toString().trim().toLowerCase();
    
    // Pokud postavu najdeme v mapě, vrátíme ji. 
    // Pokud ne, vrátíme fallback s dynamickým jménem.
    return characterMap[key] || { 
      src: unknownSrc, 
      name: key.charAt(0).toUpperCase() + key.slice(1) 
    };
  };

  const leftSidePersonType = rawPeople.length > 0 ? rawPeople[0] : null;

  function handleContinue() {
    if (onAnswered) onAnswered(true, 2);
  }

  return (
    <div className="conversation-container">
      <div className="bubbles-list">
        {rawMessages.map((text, index) => {
          
          // Získáme typ postavy (např. "medved")
          // Použijeme operator || pro případ, že people je kratší než messages (cyklení)
          const speakerType = rawPeople[index] || rawPeople[0]; 
          
          // Získáme data (src pro Rive a jméno)
          const { src, name } = getPersonData(speakerType);

          const isLeft = speakerType === leftSidePersonType;

          return (
            <div key={index} className={`bubble-row ${isLeft ? "left" : "right"}`}>
              
              {/* Avatar - Rive Komponenta */}
              <div className="avatar-container">
                {/* Rive potřebuje styl pro velikost, jinak může být obří nebo nulový */}
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden' }}>
                    <Rive 
                      src={src} 
                      className="avatar-img" // Ujisti se, že v CSS nemáš 'display: none'
                      autoplay={true}
                    />
                </div>
                <span className="person-name">{name}</span>
              </div>

              {/* Bublina s textem */}
              <div className="bubble-content">
                <p>{text}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button className="continue-btn" onClick={handleContinue}>
        Rozumím, pokračovat
      </button>
    </div>
  );
}

export default Conversation;