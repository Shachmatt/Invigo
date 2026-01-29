import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect } from 'react';

// Přidali jsme prop "nalada", abychom mohli zvenčí poslat -1, 0 nebo 1
export default function MedaAnimation({ nalada = 0 }) {
  
  const STATE_MACHINE_NAME = "State Machine 1";
  // ⚠️ Tady je ten tvůj název přesně jak jsi napsal:
  const INPUT_NAME = "num-správně, špatně"; 

  const { rive, RiveComponent } = useRive({
    src: 'meditujici_meda.riv', 
    stateMachines: STATE_MACHINE_NAME, 
    autoplay: true, 
  });

  // Tady si "sáhneme" na ten konkrétní ovladač uvnitř animace
  const riveInput = useStateMachineInput(
    rive,
    STATE_MACHINE_NAME,
    INPUT_NAME
  );

  // Kdykoliv se změní "nalada" (třeba když prohraješ), pošleme to číslo do Rive
  useEffect(() => {
    if (riveInput) {
      // Tady se nastavuje hodnota (např. -1)
      riveInput.value = nalada;
    }
  }, [nalada, riveInput]);

  return (
    <RiveComponent 
      style={{ width: '300px', height: '300px' }}
    />
  );
}