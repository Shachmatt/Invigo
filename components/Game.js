import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Game({ question, optionOneName, optionTwoName, optionOneItems, optionTwoItems, onAnswered }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [finished, setFinished] = useState(false);
  const items = useState(() => [...optionOneItems.map(i=>({name:i,isOptionOne:true})), ...optionTwoItems.map(i=>({name:i,isOptionOne:false}))].sort(()=>Math.random()-0.5))[0];

  const handleAnswer = (isOptionOne) => {
    const current = items[index];
    const correct = current.isOptionOne === isOptionOne;
    onAnswered && onAnswered(correct, 1)
    if (correct) { setScore((s)=>s+1); setFeedback(`✅ Správně – ${current.name} patří do "${isOptionOne ? optionOneName : optionTwoName}"`); }
    else { setFeedback(`❌ Špatně – ${current.name} patří do "${current.isOptionOne ? optionOneName : optionTwoName}"`); }
    setTimeout(()=>{ setFeedback(''); setIndex(i=>i+1); }, 1000);
  };

  useEffect(()=>{ if (index >= 3 && !finished) { setFinished(true); onAnswered && onAnswered(true,0); } }, [index, finished, onAnswered]);

  if (index >= 3) {
    return (
      <View style={styles.container}>
        <Text style={styles.card}>{items[2].name}</Text>
        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.btn, styles.one]} disabled><Text style={styles.btnText}>{optionOneName}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.two]} disabled><Text style={styles.btnText}>{optionTwoName}</Text></TouchableOpacity>
        </View>
        <Text style={styles.result}>🎮 Hotovo! Skóre: {score}/3</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <Text style={styles.card}>{items[index].name}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.btn, styles.one]} onPress={()=>handleAnswer(true)} disabled={feedback!==''}><Text style={styles.btnText}>{optionOneName}</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.two]} onPress={()=>handleAnswer(false)} disabled={feedback!==''}><Text style={styles.btnText}>{optionTwoName}</Text></TouchableOpacity>
      </View>
      {feedback!=='' && <Text style={styles.feedback}>{feedback}</Text>}
      <Text style={styles.score}>Skóre: {score}/3</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { alignItems: 'center', marginVertical: 12 }, question: { fontSize: 18, color: '#850F8D', fontWeight: '700', marginBottom: 12 }, card: { backgroundColor: 'white', borderWidth: 3, borderColor: '#E49BFF', borderRadius: 12, padding: 20, minHeight: 80, alignItems: 'center', justifyContent: 'center' }, buttons: { flexDirection: 'row', gap: 12, marginTop: 12 }, btn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }, one: { backgroundColor: '#4CAF50' }, two: { backgroundColor: '#f44336' }, btnText: { color: 'white', fontWeight: '700' }, feedback: { marginTop: 12 }, score: { marginTop: 8, color: '#850F8D' } });
