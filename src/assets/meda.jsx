import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect, useState } from 'react';

export default function MedaAnimation({ nalada = 0 }) {
  // Stav pro uložení skutečných názvů, které si zjistíme sami
  const [detectedConfig, setDetectedConfig] = useState({ sm: "", input: "" });

  const { rive, RiveComponent } = useRive({
    src: 'meditujici_meda.riv',
    autoplay: true,
    onLoad: () => {
      // Tady proběhne detektivní práce ihned po načtení
      if (!rive) return;

      // 1. Zjistíme název State Machine (vezmeme prostě první, co existuje)
      const machineName = rive.stateMachineNames[0];
      
      // 2. Zjistíme vstupy
      const inputs = rive.stateMachineInputs(machineName);
      // Vezmeme první input, který najdeme (předpokládáme, že tam je jen ten jeden pro náladu)
      const firstInput = inputs[0];

      if (machineName && firstInput) {
        console.log(`✅ ÚSPĚCH! Nalezeno: Machine="${machineName}", Input="${firstInput.name}"`);
        
        // 3. OKAMŽITĚ NASTAVÍME NA 0 (RESET)
        // Tohle zajistí, že méďa přestane jásat hned na startu
        firstInput.value = 0;

        // Uložíme si názvy pro React
        setDetectedConfig({ sm: machineName, input: firstInput.name });
      }
    }
  });

  // Oficiální propojení s Reactem pomocí zjištěných názvů
  const riveInput = useStateMachineInput(rive, detectedConfig.sm, detectedConfig.input);

  // Reakce na změny ze cvičení (Question.jsx)
  useEffect(() => {
    if (riveInput) {
      riveInput.value = nalada;
    }
  }, [nalada, riveInput]);

  return (
    <div style={{ width: '300px', height: '300px' }}>
      <RiveComponent />
    </div>
  );
}