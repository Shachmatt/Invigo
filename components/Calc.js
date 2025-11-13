import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function Calc({ question, correct, onAnswered, typeResult }) {
  const [answer, setAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);

  const checkAnswer = () => {
    if (answer.trim() === '') return;
    const numeric = Number(answer);
    const ok = numeric === correct;
    setHasAnswered(true);
    onAnswered && onAnswered(ok, 0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} keyboardType="numeric" value={answer} onChangeText={setAnswer} editable={!hasAnswered} />
        <TouchableOpacity style={styles.btn} onPress={checkAnswer} disabled={hasAnswered}>
          <Text style={styles.btnText}>Ověřit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 12 },
  question: { fontSize: 20, color: '#850F8D', fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { borderWidth: 2, borderColor: '#C738BD', padding: 10, borderRadius: 8, width: 120, textAlign: 'center', fontSize: 16 },
  btn: { backgroundColor: '#850F8D', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: '700' }
});
