// Declarations for JS components used from TypeScript files
declare module '../components/Calc' {
  const Calc: any;
  export default Calc;
}
declare module '../components/Question' {
  const Question: any;
  export default Question;
}
declare module '../components/Game' {
  const Game: any;
  export default Game;
}
declare module '../components/MatchExercise' {
  const MatchExercise: any;
  export default MatchExercise;
}
declare module '../components/Info' {
  const Info: any;
  export default Info;
}

// wildcard to cover any other component imports from ../components/
declare module '../components/*' {
  const m: any;
  export default m;
}
