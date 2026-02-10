import React from "react";
import "./conversation.css"; 
import Rive from '@rive-app/react-canvas';


// 1. Importuj si obrázky postav přímo sem
// (Předpokládám, že je máš v assets, uprav si cestu podle reality)
var medvedImg = "../../public/riváček.riv"; 
var holkaImg = "../../public/holčička.riv";
var bykImg=  "../../public/úplně_konečný_býk.riv";

function Conversation({ people = [], messages = [], onAnswered }) {

  // 2. Vytvoř mapovací objekt (Slovník: Název z DB -> Importovaný obrázek)
  const characterMap = {
    "medved": medvedImg,
    "holka": holkaImg,
    "byk": bykImg,
  };

const getPersonData = (typeString) => {
    if (!typeString) return { img: unknownImg, name: "Neznámý" };
    
    // Převedeme na malá písmena a ořízneme mezery (pro jistotu)
    const key = typeString.toString().trim().toLowerCase();
    
    return characterMap[key] || { 
      img: unknownImg, 
      name: key.charAt(0).toUpperCase() + key.slice(1) // Pokud nemáme obrázek, použijeme název jako jméno
    };
  };

  // Určíme, kdo bude vlevo (obvykle Méďa nebo první mluvčí)
  // Tady říkáme: První osoba v poli 'people' určuje "levou stranu"
  const leftSidePersonType = people.length > 0 ? people[0] : null;

  function handleContinue() {
    // Typ 2 v App.jsx znamená "jen pokračuj, nepočítej skóre"
    if (onAnswered) onAnswered(true, 2);
  }

  return (
    <div className="conversation-container">
      <div className="bubbles-list">
        {messages.map((text, index) => {
          // TADY JE TA ZMĚNA:
          // Pro zprávu na indexu [i] vezmeme mluvčího z people na indexu [i]
          const speakerType = people[index]; 
          
          // Získáme obrázek a jméno
          const { img, name } = getPersonData(speakerType);

          // Rozhodneme, jestli je bublina vlevo nebo vpravo
          // Pokud je to stejný typ postavy jako ten úplně první v poli, dáme ho vlevo.
          const isLeft = speakerType === leftSidePersonType;

          return (
            <div key={index} className={`bubble-row ${isLeft ? "left" : "right"}`}>
              
              {/* Avatar */}
              <div className="avatar-container">
                <Rive 
                  src={img} 
                  className="avatar-img" 
                />
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