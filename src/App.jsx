import { useState, useEffect } from 'react' 
import './App.css'
import Question from "./excercises/correct";
import Navbar from "./assets/navbar";
import Calc from "./excercises/calc";
import Game from "./excercises/game";
import MatchExcercise from './excercises/dndtest';
import Info from './excercises/info';
import Ending from './excercises/ending';
import Bottom from './assets/bottom';
import Rive from '@rive-app/react-canvas';
import Conversation from './excercises/conversation';

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
  const [lesson, setLesson] = useState([]);
  const [lessonTitle, setLessonTitle] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stav pro krokování konverzace
  const [subStep, setSubStep] = useState(1);

  // Fetch lesson data from API
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const lessonId = urlParams.get('id') || '1'; 
    
    fetch(`/api/lessons/${lessonId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch lesson');
        }
        return response.json();
      })
      .then(data => {
        setLesson(data.exercises || []);
        setLessonTitle(data.title || "Lekce");
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching lesson:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (hearts === 0) {
      setShoutout("Moc se ti to nepovedlo, je čas udělat pápá!");
      setDisabled(false);
      setButton("Začít znovu")
      setLink(1)
    }
  }, [hearts]);

  useEffect(() => {
    if (completed === lesson.length && hearts > 0 && !showEnding) {
      setDisabled(false);
      setButton("Zobraz výsledky");
      setShoutout("Gratulujeme! Klikni pro zobrazení výsledků!");
    }
  }, [completed, hearts, showEnding, lesson.length]);

  // Resetování krokování při změně cvičení
  useEffect(() => {
    setSubStep(1); 
    
    if (lesson[excercise]?.type === 'Conversation') {
       setButton("Dále...");
       setDisabled(false); 
    }
  }, [excercise, lesson]);

  const componentMap = {
    Info: Info,
    Question: Question,
    Calc: Calc,
    Game: Game,
    MatchExcercise: MatchExcercise,
    Conversation: Conversation
  };

  function handleAnswered(isCorrect, type) {
    if(type == 0){
      setCompleted(completed + 1);
      setDisabled(false);
      setButton("Pokračuj");
      if (isCorrect) {
        setShoutout("Správně!");
      } else {
        setShoutout("Špatně :/");
        setHearts((prevHearts) => prevHearts - 1);
      }
    } else if (type == 1){
      if (isCorrect) {
        setShoutout("Správně!");
      } else {
        setShoutout("Špatně :/");
        setHearts((prevHearts) => prevHearts - 1);
      }
    } else if (type == 2) {
      setCompleted(completed + 1);
      setShoutout("Pojďme na to!")
      setButton("Pokračuj")
      setDisabled(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><p>Načítání lekce...</p></div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><p>Chyba: {error}</p></div>;
  }

  if (lesson.length === 0) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><p>Lekce neobsahuje žádná cvičení.</p></div>;
  }

  const current = lesson[excercise];
  const CurrentExercise = current ? componentMap[current.type] : null;

  // === HLAVNÍ LOGIKA TLAČÍTKA ===
  function handleClicked() {
    
    // 1. ZVLÁŠTNÍ LOGIKA PRO KONVERZACI
    if (current && current.type === 'Conversation') {
      const msgs = current.messages || (current.data && current.data.messages) || [];
      
      // A) Pokud ještě nejsme na konci zpráv -> Odkrýt další
      if (subStep < msgs.length) {
        setSubStep(prev => prev + 1);
        if (subStep + 1 === msgs.length) {
           setButton("Dokončit konverzaci");
        }
        return; // Zastavíme, nejdeme na další cvičení
      }
      
      // B) Jsme na konci zpráv -> Označit jako splněné (pokud ještě není)
      // Poznámka: completed == excercise znamená, že aktuální cvičení ještě nebylo započteno
      if (completed === excercise) {
         handleAnswered(true, 2); 
         return; // Tlačítko se změní na "Pokračuj", čekáme na další kliknutí
      }
    }

    // 2. STANDARDNÍ NAVIGACE (Další cvičení / Konec)
    if (completed === lesson.length && !showEnding) {
      setShowEnding(true);
      setButton("Začít znovu");
      setShoutout("Zobraz výsledky!");
      setDisabled(false);
      setLink(1);
    } else if (showEnding) {
      window.location.href = "/";
    } else {
      // Posun na další cvičení
      setExcercise(excercise + 1);
      setButton("To zvládneš!");
      setShoutout("Dokonči cvičení");
      setDisabled(true);
    }
  }

  return (
    <>
      <Navbar 
        lessonTitle={lessonTitle} 
        subtitle="Investigo" 
        totalExercises={lesson.length} 
        completedExercises={completed} 
        hearts={hearts} 
      />

      {hearts !== 0 && !showEnding && CurrentExercise && (
        <CurrentExercise
          {...current}
          onAnswered={handleAnswered}
          subStep={subStep} // Musí být subStep (velké S), aby to sedělo s Conversation.jsx
        />
      )}

      {hearts === 0 && (
        <div className='fail'> 
           <div style={{width: 300, height: 300}}> 
              <Rive src="meditující_méďa.riv" /> 
           </div>
        </div>
      )}

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