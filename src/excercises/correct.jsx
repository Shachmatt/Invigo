import { useState } from "react";
import MedaAnimation from "../assets/meda";

function Question({ question, a1, a2, a3, a4, correct, onAnswered }) {
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [medaAns, setMedaAns] = useState(0);
 

  function handleClick(answer) {
    if (selected === null) {
      setSelected(answer);
      setIsCorrect(answer === correct);
      const result = (answer === correct)
      if (result) {
        setMedaAns(1)
      } else {
        setMedaAns(-1)
      }
    if (onAnswered) onAnswered(answer===correct, 0); 
    

    }
  }

  // Helper to get button style
  function getButtonClass(answer) {
    if (!selected) return "";
    if (answer === correct) return "correct";
    if (answer === selected) return "incorrect";
    else return "";
  }

  return (
    <>
    <center>
      <p className="question">{question}</p></center>

       <MedaAnimation 
    nalada={medaAns} />


      <div className="answers">
   {[a1, a2, a3, a4].map((answer, i) => (
  <button
    key={i}
    onClick={() => handleClick(answer)}
    className={"answer-btn " + getButtonClass(answer)}
    disabled={selected !== null}
  >
    {answer}
  </button>
))}

      </div>

      
    </>
  );
}

export default Question;