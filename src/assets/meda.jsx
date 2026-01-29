import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect } from 'react';

export default function MedaAnimation({ nalada = 0 }) {
  const STATE_MACHINE_NAME = "State Machine 1";
  const INPUT_NAME = "num-správně, špatně"; 

  const { rive, RiveComponent } = useRive({
    src: 'meditujici_meda.riv',
    stateMachines: STATE_MACHINE_NAME,
    autoplay: true,
    onLoad: () => {
      console.log("✅ Rive načteno");
    }
  });

  const riveInput = useStateMachineInput(rive, STATE_MACHINE_NAME, INPUT_NAME);

  // LOGOVÁNÍ PRO DIAGNOSTIKU
  useEffect(() => {
    if (rive) {
      // Tohle nám vypíše VŠECHNY dostupné vstupy do konzole
      const inputs = rive.stateMachineInputs(STATE_MACHINE_NAME);
      console.log("Dostupné vstupy v Rive:", inputs.map(i => i.name));
      
      if (riveInput) {
        console.log("✅ Input nalezen, nastavuji hodnotu:", nalada);
        riveInput.value = nalada;
      } else {
        console.error(`❌ Input "${INPUT_NAME}" nebyl nalezen!`);
      }
    }
  }, [rive, riveInput, nalada]);

  return (
    <div style={{ width: '300px', height: '300px' }}>
      <RiveComponent />
    </div>
  );
}