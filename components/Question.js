import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Question({ question, a1, a2, a3, a4, correct, onAnswered }) {
  const [selected, setSelected] = useState(null);

  function handleClick(answer) {
    if (selected === null) {
      setSelected(answer);
      const ok = answer === correct;
      setTimeout(() => {
        onAnswered && onAnswered(ok, 0);
      }, 10);
    }
  }

  function btnStyle(answer) {
    if (!selected) return styles.answerBtn;
    if (answer === correct) return [styles.answerBtn, styles.correct];
    if (answer === selected) return [styles.answerBtn, styles.incorrect];
    return styles.answerBtn;
  }

  return (
    <View style={{ alignItems: 'center', marginVertical: 12 }}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.answers}>
        {[a1, a2, a3, a4].map((answer, i) => (
          <TouchableOpacity key={i} onPress={() => handleClick(answer)} disabled={selected !== null} style={btnStyle(answer)}>
            <Text>{answer}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  question: { fontSize: 20, color: '#850F8D', fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  answers: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  answerBtn: { padding: 16, backgroundColor: 'white', borderWidth: 2, borderColor: '#E49BFF', borderRadius: 10, margin: 6, minWidth: 140 },
  correct: { backgroundColor: '#4CAF50', color: 'white' },
  incorrect: { backgroundColor: '#f44336', color: 'white' }
});
