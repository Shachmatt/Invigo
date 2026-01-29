import { useRive } from '@rive-app/react-canvas';

export default function MedaAnimation() {
  const { rive, RiveComponent } = useRive({
    src: 'meditujici_meda.riv', // Zde dej název souboru ve složce public
    stateMachines: "State Machine 1", // ⚠️ TADY musíš napsat přesný název ze svého Rive souboru!
    autoplay: true, // Pro obrazovku prohry asi chceš, aby se spustil hned, že?
  });

  return (
    // RiveComponent se chová jako div, můžeš mu dát styly
    <RiveComponent 
      style={{ width: '300px', height: '300px' }}
      // Pokud chceš tu interaktivitu z návodu (hover), nech to tu:
      onMouseEnter={() => rive && rive.play()}
      onMouseLeave={() => rive && rive.pause()}
    />
  );
}