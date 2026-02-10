import React from "react";
import "./conversation.css"; 
import Rive from '@rive-app/react-canvas';


// 1. Importuj si obrázky postav přímo sem
// (Předpokládám, že je máš v assets, uprav si cestu podle reality)
import medvedImg from "../../public/riváček.riv"; 
import holkaImg from "../../public/holčička.riv";
import bykImg from "../../public/úplně_konečný_býk.riv";

function Conversation({ people, messages, onAnswered }) {

  // 2. Vytvoř mapovací objekt (Slovník: Název z DB -> Importovaný obrázek)
  const characterMap = {
    "medved": medvedImg,
    "holka": holkaImg,
    "byk": bykImg,
  };

  // Pomocná funkce pro získání postavy
  const getPerson = (id) => {
    // Najdeme objekt postavy v poli people
    const personData = people.find((p) => p.id === id);
    
    if (!personData) return { name: "Neznámý", avatar: unknownImg };

    // 3. TADY JE TA MAGIE:
    // Podíváme se, jestli máme obrázek pro 'personData.type' (např. "medved")
    // Pokud ne, použijeme default
    const avatarSrc = characterMap[personData.type] || unknownImg;

    return { 
      name: personData.name, 
      avatar: avatarSrc 
    };
  };

  // Zjistíme ID hlavní postavy (obvykle ta první v poli people), ta bude vlevo
  const mainCharacterId = people.length > 0 ? people[0].id : null;

  function handleContinue() {
    if (onAnswered) onAnswered(true, 2);
  }

  return (
    <div className="conversation-container">
      <div className="bubbles-list">
        {messages.map((msg, index) => {
          const person = getPerson(msg.personId);
          // Hlavní postava vlevo, ostatní vpravo
          const isLeft = msg.personId === mainCharacterId;

          return (
            <div key={index} className={`bubble-row ${isLeft ? "left" : "right"}`}>
              
              {/* Avatar */}
              <div className="avatar-container">
                <Rive 
                  src={person.avatar} 
                  className="avatar-img" 
                />
                <span className="person-name">{person.name}</span>
              </div>

              {/* Bublina */}
              <div className="bubble-content">
                <p>{msg.text}</p>
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