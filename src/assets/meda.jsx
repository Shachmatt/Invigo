import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect, useState } from 'react';

export default function MedaAnimation({ nalada = 0 }) {
  // 1. Necháme State Machine zatím prázdnou, zjistíme ji za běhu
  const [stateMachineName, setStateMachineName] = useState("");
  const INPUT_NAME = "num-správně, špatně"; 

  const { rive, RiveComponent } = useRive({
    src: 'meditujici_meda.riv',
    autoplay: true,
    onLoad: () => {
      if (rive) {
        // Zjistíme, jak se jmenuje první State Machine v souboru
        const machine = rive.stateMachineNames[0];
        console.log("🔍 Tvoje State Machine se ve skutečnosti jmenuje:", machine);
        setStateMachineName(machine);
      }
    }
  });

  // 2. Napojíme se na input, až když víme název mašiny
  const riveInput = useStateMachineInput(rive, stateMachineName, INPUT_NAME);

  useEffect(() => {
    if (riveInput) {
      console.log("✅ ÚSPĚCH! Posílám hodnotu:", nalada);
      riveInput.value = nalada;
    }
  }, [nalada, riveInput]);

  return (
    <div style={{ width: '300px', height: '300px' }}>
      <RiveComponent />
    </div>
  );
}