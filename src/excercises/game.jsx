import React, { useEffect, useState } from "react";

export default function Game({
  question,
  optionOneName,
  optionTwoName,
  optionOneItems,
  optionTwoItems,
  onAnswered
}) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [finished, setFinished] = useState(false);

  // sloučíme všechny položky do jedné s označením kategorie
 const [items] = useState(() =>
  [
    ...optionOneItems.map((i) => ({ name: i, isOptionOne: true })),
    ...optionTwoItems.map((i) => ({ name: i, isOptionOne: false })),
  ].sort(() => Math.random() - 0.5)
);

  console.log(items);

  const handleAnswer = (isOptionOne) => {
    const current = items[index];
    const correct = current.isOptionOne === isOptionOne;
    onAnswered && onAnswered(correct, 1)
    if (correct) {
            setScore((s) => s + 1);
      setFeedback(`✅ Správně – ${current.name} patří do "${isOptionOne ? optionOneName : optionTwoName}"`);
    } else {
      setFeedback(`❌ Špatně – ${current.name} patří do "${current.isOptionOne ? optionOneName : optionTwoName}"`);
    }

    setTimeout(() => {
      setFeedback("");
      setIndex((i) => i + 1);
    }, 1000);
  };

  useEffect(() => {
    if (index >= 3 && !finished) {
      setFinished(true);
      onAnswered && onAnswered(score === 3, 0);
    }
  }, [index, finished, onAnswered, score]);

  if (index >= 3) {
    return (
      <div className="fgame-container">
        <div className="fgame-card">{items[2].name}</div>
        <div className="fgame-buttons">
          <button className="fgame-btn option-one" disabled>
            {optionOneName}
          </button>
          <button className="fgame-btn option-two" disabled>
            {optionTwoName}
          </button>
        </div>
        <p className="fgame-result">
          🎮 Hotovo! Skóre: {score}/3
        </p>
      </div>
    );
  }

  return (
    <div className="fgame-container">
      <p className="question">{question}</p>
      <div className="fgame-card">{items[index].name}</div>
      <div className="fgame-buttons">
        <button
          className="fgame-btn option-one"
          onClick={() => handleAnswer(true)}
          disabled={feedback !== ""}
        >
          {optionOneName}
        </button>
        <button
          className="fgame-btn option-two"
          onClick={() => handleAnswer(false)}
          disabled={feedback !== ""}
        >
          {optionTwoName}
        </button>
      </div>
      {feedback && <div className="fgame-feedback">{feedback}</div>}
      <div className="fgame-score">Skóre: {score}/3</div>
    </div>
  );
}
