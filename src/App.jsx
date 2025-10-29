import { useState, useEffect } from 'react' 
import './App.css'
import Question from "./excercises/correct"
import Navbar from "./assets/navbar";
import Calc from "./excercises/calc"
import Game from "./excercises/game"
import MatchExcercise from './excercises/dndtest';
import Info from './excercises/info';
import Bottom from './assets/bottom';
import Rive from '@rive-app/react-canvas';

function App() {

  const [completed, setCompleted] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [shoutout, setShoutout] = useState("Complete an exercise");
  const [button, setButton] = useState("I have faith in you!");
  const [disabled, setDisabled] = useState(true);
  const [excercise, setExcercise] = useState(0);
  const [link, setLink] = useState(0);

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
    setButton("Continue");
    if (isCorrect) {
      setShoutout("Correct!");
    } else {
      setShoutout("Incorrect :/");
      setHearts((prevHearts) => prevHearts - 1);
    }} else if (type==1){
      if (isCorrect) {
      setShoutout("Correct!");
    } else {
      setShoutout("Incorrect :/");
      setHearts((prevHearts) => prevHearts - 1);
    }
  } else if (type==2) {
    setCompleted(completed + 1);
    setShoutout("Let's dive in!")
    setButton("Continue")
    setDisabled(false)
  }}

  useEffect(() => {
    if (hearts === 0) {
      setShoutout("Moc se ti to nepovedlo, je čas udělat pápá!");
      setDisabled(false);
      setButton("Start over")
      setLink(1)
    }
  }, [hearts]);



  function handleClicked() {
setExcercise(excercise+1)
setButton("I have faith in you!");
setShoutout("Complete an excercise");
setDisabled(true)
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
 { hearts!==0 && <CurrentExercise
        {...current}
        onAnswered={handleAnswered}
      />}
  {hearts===0 && <div className='fail'> <div style={{width: 300, height: 300}}> <Rive src="riváček.riv" /> 
  </div></div>}

      
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
