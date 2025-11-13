import { useState, useEffect } from 'react' 
import './App.css'
import Question from "./excercises/correct"
import Navbar from "./assets/navbar";
import Calc from "./excercises/calc"
import Game from "./excercises/game"
import MatchExcercise from './excercises/dndtest';
import Info from './excercises/info';
import Ending from './excercises/ending';
import Bottom from './assets/bottom';
import Rive from '@rive-app/react-canvas';

function App() {

  const [completed, setCompleted] = useState(0);
  const [hearts, setHearts] = useState(3);
  const initialHearts = 3;
  const [shoutout, setShoutout] = useState("Complete an exercise");
  const [button, setButton] = useState("I have faith in you!");
  const [disabled, setDisabled] = useState(true);
  const [excercise, setExcercise] = useState(0);
  const [link, setLink] = useState(0);
  const [showEnding, setShowEnding] = useState(false);

  // 🔹 Lekce obsahuje typ komponenty
  const lesson = [
    {
      type: "Info",
      title: "Vítej v lekci o burze!",
      icon: "💡",
      content: "V této lekci se naučíš rozdíl mezi burzou a tržištěm. Burza je organizované místo, kde se obchodují cenné papíry jako akcie velkých společností. Tržiště je místo, kde lidé obchodují se zbožím a produkty denní potřeby."
    },
    {
      type: "Question",
      question: "Jak se máš?",
      a1: "Dobře",
      a2: "Ujde to",
      a3: "Špatně",
      a4: "Idk",
      correct: "Ujde to"
    },
    {type: "Calc",
      question: "Kolik je 1+1",
      correct: 2,
      typeResult: "number"
    },
    {
      type: "Game",
      question: "Burza nebo tržiště?",
      optionOneName:"Burza",
      optionTwoName: "Tržiště",
      optionOneItems: ["Akcie Apple", "Akcie Tesla", "Akcie Microsoft"],
      optionTwoItems: ["Jablko", "mrkev", "Oblečení"]
    },
    {type: "MatchExcercise",
      options: ["Jablko", "Banán", "Mrkev", "Salát", "lilek"],
      labels: ["Červené ovoce", "Žluté ovoce", "Oranžové ovoce", "Zelené ovoce", "fialové ovoce"]
    }
  ];

  // 🔹 Mapa typů na komponenty
  const componentMap = {
    Info: Info,
    Question: Question,
    Calc: Calc,
    Game: Game,
    MatchExcercise: MatchExcercise
  };

  const CurrentExercise = componentMap[lesson[excercise].type];

  function handleAnswered(isCorrect, type) {
    if(type==0){
    setCompleted(completed + 1);
    setDisabled(false);
    setButton("Pokračuj");
    if (isCorrect) {
      setShoutout("Správně!");
    } else {
      setShoutout("Špatně :/");
      setHearts((prevHearts) => prevHearts - 1);
    }} else if (type==1){
      if (isCorrect) {
      setShoutout("Správně!");
    } else {
      setShoutout("Špatně :/");
      setHearts((prevHearts) => prevHearts - 1);
    }
  } else if (type==2) {
    setCompleted(completed + 1);
    setShoutout("Pojďme na to!")
    setButton("Pokračuj")
    setDisabled(false)
  }}

  useEffect(() => {
    if (hearts === 0) {
      setShoutout("Moc se ti to nepovedlo, je čas udělat pápá!");
      setDisabled(false);
      setButton("Začít znovu")
      setLink(1)
    }
  }, [hearts]);

  useEffect(() => {
    // When all exercises are completed, prepare to show ending
    if (completed === lesson.length && hearts > 0 && !showEnding) {
      setDisabled(false);
      setButton("Zobraz výsledky");
      setShoutout("Gratulujeme! Klikni pro zobrazení výsledků!");
    }
  }, [completed, hearts, showEnding, lesson.length]);



  function handleClicked() {
    if (completed === lesson.length && !showEnding) {
      // Show ending component when all exercises are completed
      setShowEnding(true);
      setButton("Začít znovu");
      setShoutout("Zobraz výsledky!");
      setDisabled(false);
      setLink(1);
    } else if (showEnding) {
      // Reset everything when clicking "Start over" from ending
      window.location.href = "/";
    } else {
      setExcercise(excercise+1);
      setButton("To zvládneš!");
      setShoutout("Dokonči cvičení");
      setDisabled(true);
    }
  }
const current = lesson[excercise];



  return (
    <>
      <Navbar 
        lessonTitle="Co je burza?" 
        subtitle="Lekce 3 - Investigo" 
        totalExercises={lesson.length} 
        completedExercises={completed} 
        hearts={hearts} 
      />

      {/* 🔹 Tady se dynamicky vykreslí správná komponenta */}
 { hearts!==0 && !showEnding && <CurrentExercise
        {...current}
        onAnswered={handleAnswered}
      />}
  {hearts===0 && <div className='fail'> <div style={{width: 300, height: 300}}> <Rive src="riváček.riv" /> 
  </div></div>}
  {showEnding && hearts > 0 && (
    <Ending 
      heartsLost={initialHearts - hearts}
      totalExercises={lesson.length}
      completedExercises={completed}
      initialHearts={initialHearts}
    />
  )}
      
      <Bottom 
        shoutout={shoutout}
        button={button}
        disabled={disabled}
        link={link}
        onClicked={handleClicked}
      />
    </>
  );
}

export default App;
