import React, { useMemo } from "react";
import "./assets.css"; // propojení s CSS souborem
import Rive from '@rive-app/react-canvas';


export default function Navbar({totalExercises, completedExercises, hearts }) {
  const progress = useMemo(() => {
    if (totalExercises === 0) return 0;
    return Math.min((completedExercises / totalExercises) * 100, 100);
  }, [totalExercises, completedExercises]);

  return (
    <nav className="navbar">
      <div className="navbar-left">
    <div >InvestiGO
    </div>       
      </div>

      <div className="navbar-center">
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }} />
        </div>

{hearts>0 && <div >
      ❤️
    </div> } {hearts>1 && <div >
      ❤️
    </div> }{hearts>2 && <div >
      ❤️
    </div> }

      </div>

    </nav>
  );
}
