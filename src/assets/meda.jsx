import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect, useState } from 'react';

export default function MedaAnimation({ nalada = 0 }) {
  // Tady si budeme ukládat, co jsme zjistili, abychom to vypsali na obrazovku
  const [debugLog, setDebugLog] = useState("Čekám na Rive...");
  
  // Názvy, které zkusíme použít
  const SM_NAME = "State Machine 1";
  const INPUT_NAME = "num-správně, špatně"; 

  const { rive, RiveComponent } = useRive({
    src: 'meditujici_meda.riv',
    stateMachines: SM_NAME, // Zkusíme to natvrdo
    autoplay: true,
  });

  const riveInput = useStateMachineInput(rive, SM_NAME, INPUT_NAME);

  // Tento efekt běží, jakmile se Rive načte
  useEffect(() => {
    if (rive) {
      // 1. Zjistíme skutečné názvy v souboru
      const machines = rive.stateMachineNames;
      
      // Pokusíme se najít náš input
      let foundInput = "NENALEZEN";
      let allInputs = [];
      
      if (machines.length > 0) {
        // Projdeme vstupy první mašiny
        const inputs = rive.stateMachineInputs(machines[0]);
        allInputs = inputs.map(i => i.name);
        
        const target = inputs.find(i => i.name === INPUT_NAME);
        if (target) {
          foundInput = "NALEZEN A FUNGUJE";
          // ⚠️ TADY JE TEN FIX - OKAMŽITĚ NULUJEME
          target.value = 0; 
        }
      }

      // Vypíšeme info na obrazovku
      setDebugLog(
        `Stav: ${foundInput}\n` +
        `Mašiny v souboru: ${JSON.stringify(machines)}\n` +
        `Vstupy v souboru: ${JSON.stringify(allInputs)}\n` +
        `Hledáme input: "${INPUT_NAME}"`
      );
    }
  }, [rive]);

  // Reakce na změnu nálady z aplikace
  useEffect(() => {
    if (riveInput) {
      riveInput.value = nalada;
    }
  }, [nalada, riveInput]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '300px', height: '300px' }}>
        <RiveComponent />
      </div>
      
      {/* Tady je ten diagnostický panel */}
      <div style={{ 
        background: 'black', 
        color: '#0f0', 
        padding: '10px', 
        marginTop: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px',
        maxWidth: '400px',
        textAlign: 'left',
        whiteSpace: 'pre-wrap'
      }}>
        {debugLog}
      </div>
    </div>
  );
}