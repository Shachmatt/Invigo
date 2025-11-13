import React from "react";

export default function Ending({ heartsLost, totalExercises, completedExercises, initialHearts }) {
  const heartsRemaining = initialHearts - heartsLost;
  const performance = heartsRemaining === 3 ? "Perfektní! 🎉" : 
                      heartsRemaining === 2 ? "Skvělá práce! 🌟" :
                      heartsRemaining === 1 ? "Dobrá práce! 💪" :
                      "Zvládnul jsi to! 👏";
  
  const message = heartsRemaining === 3 
    ? "Neuvěřitelné!Neztratil jsi žádný život! 💪"
    : heartsRemaining === 2
    ? "Ztratil jsi jen jeden život - skvělá práce! 💪"
    : heartsRemaining === 1
    ? "Ztratil jsi dva životy, ale pokračoval jsi - to je odhodlání! 💪"
    : "Dokončil jsi lekci i přes výzvy - dobře! 💪";

  return (
    <div className="ending-container">
      <div className="ending-card">
        <h1 className="ending-title">🎓 Lekce Dokončena!</h1>
        
        <div className="ending-stats">
          <div className="stat-item">
            <div className="stat-label">Ztracené životy</div>
            <div className="stat-value hearts-lost">{heartsLost} ❤️</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">Zbývající životy</div>
            <div className="stat-value hearts-remaining">{heartsRemaining} ❤️</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">Dokončená cvičení</div>
            <div className="stat-value">{completedExercises}/{totalExercises}</div>
          </div>
        </div>

        <div className="ending-performance">
          <h2 className="performance-title">{performance}</h2>
          <p className="performance-message">{message}</p>
        </div>

        <div className="ending-hearts-display">
          {Array.from({ length: initialHearts }).map((_, i) => (
            <span key={i} className={i < heartsRemaining ? "heart-full" : "heart-lost"}>
              {i < heartsRemaining ? "❤️" : "🤍"}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
