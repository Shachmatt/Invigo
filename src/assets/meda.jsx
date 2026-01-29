import { useRive, useStateMachineInput, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { useEffect } from 'react';

// Přijímáme -1 (špatně), 0 (nic), 1 (správně)
export default function MedaAnimation({ nalada = 0 }) {
  
  // Změň podle toho, jak jsi to teď nastavil v Rive
  // Doporučuji v Rive input přejmenovat na "status", je to bezpečnější
  const INPUT_NAME = "Number 1"; 
  const STATE_MACHINE_NAME = "State Machine 2";

  const { rive, RiveComponent } = useRive({
    src: 'meditujici_meda.riv', // ⚠️ Soubor musí být ve složce /public/meda.riv
    stateMachines: STATE_MACHINE_NAME,
    autoplay: true,
    // 2. TADY JE TA MAGIE PRO OŘEZÁNÍ:
    layout: new Layout({
      fit: Fit.Cover,  // Cover = roztáhni se tak, abys vyplnil prostor (tím se ořízne prázdno)
      alignment: Alignment.BottomCenter, // BottomCenter = drž se dole (ořízne se vršek)
    }),
  });

  const riveInput = useStateMachineInput(rive, STATE_MACHINE_NAME, INPUT_NAME);

  useEffect(() => {
    if (riveInput) {
      // Hned jak se to změní, pošleme číslo do Rive
      riveInput.value = nalada;
    }
  }, [nalada, riveInput]);

  return (
<div style={{ width: '100%', maxWidth: '300px', height: '180px', margin: '0 auto' }}>
       <RiveComponent />
    </div>
  );
}