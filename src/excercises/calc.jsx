import React, { useState } from "react";

export default function Calc({ question, correct, onAnswered, typeResult }) {
  const [answer, setAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null)
  const [hasAnswered, setHasAnswered] = useState(false);

  const checkAnswer = () => {
    if (answer.trim() === "") {
      setFeedback("❗ Zadej odpověď");
      return;
    }
    if (Number(answer) === correct) {
      setHasAnswered(true)
      setIsCorrect(true)
      if (onAnswered) onAnswered(true, 0); 
    } else {
      setIsCorrect(false)
      setHasAnswered(true)
      if (onAnswered) onAnswered(false, 0); 

    }
  };

  return (
    <div className="container">
      <p className="question">{question}</p>
     <div className="calc-input">
      <input
        type={typeResult}
        className=""
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <button  className="calc-btn" onClick={checkAnswer} disabled={hasAnswered}
>
        Ověřit
      </button>
    </div></div>
  );
}
