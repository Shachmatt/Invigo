import React, { useState, useEffect, useRef } from "react";
import "./conversation.css"; 
import Rive from '@rive-app/react-canvas';

// Cesty k souborům v public složce
const medvedSrc = "/riváček.riv"; 
const holkaSrc = "/holčička.riv";
const bykSrc = "/úplně_konečný_býk.riv"; 
const unknownSrc = "/riváček.riv"; 

function Conversation({ people = [], messages = [], data, onAnswered, subStep = 1}) {

  // Rozbalení dat
  const rawPeople = people || (data && data.people) || [];
  const rawMessages = messages || (data && data.messages) || [];

  // --- NOVÉ: Stav pro postupné odkrývání ---
  // Začínáme na 1 (zobrazíme první zprávu hned)
  const [visibleCount, setVisibleCount] = useState(1);
  
  // Reference pro automatické scrollování dolů
  const messagesEndRef = useRef(null);

  // Mapa postav
  const characterMap = {
    "medved": { src: medvedSrc, name: "Pan Méďa" },
    "holka":  { src: holkaSrc, name: "Anna" },
    "byk":    { src: bykSrc, name: "Pan Býk" },
  };

  const getPersonData = (typeString) => {
    if (!typeString) return { src: unknownSrc, name: "Neznámý" };
    const key = typeString.toString().trim().toLowerCase();
    return characterMap[key] || { 
      src: unknownSrc, 
      name: key.charAt(0).toUpperCase() + key.slice(1) 
    };
  };

  const leftSidePersonType = rawPeople.length > 0 ? rawPeople[0] : null;

useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [subStep]);

  return (
    <div className="conversation-container">
      <div className="bubbles-list">
        {/* Zobrazujeme jen část zpráv (slice) podle visibleCount */}
        {rawMessages.slice(0, subStep).map((text, index) => {
          
          const speakerType = rawPeople[index] || rawPeople[0]; 
          const { src, name } = getPersonData(speakerType);
          const isLeft = speakerType === leftSidePersonType;

          return (
            <div key={index} className={`bubble-row ${isLeft ? "left" : "right"}`}>
              
              <div className="avatar-container">
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden' }}>
                    <Rive 
                      src={src} 
                      className="avatar-img" 
                      autoplay={true}
                    />
                </div>
                <span className="person-name">{name}</span>
              </div>

              <div className="bubble-content">
                <p>{text}</p>
              </div>
            </div>
          );
        })}
        {/* Neviditelný prvek na konci seznamu pro scroll */}
        <div ref={messagesEndRef} />
      </div>

      
    </div>
  );
}

export default Conversation;