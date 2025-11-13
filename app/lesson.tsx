import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

// Import existing exercise components (no project structure changes)
import Calc from '../components/Calc';
import Question from '../components/Question';
import Game from '../components/Game';
import MatchExercise from '../components/MatchExercise';
import Info from '../components/Info';

export default function Lesson() {
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleAnswered(isCorrect: boolean, type: number) {
    setMessage(isCorrect ? 'Správně!' : 'Špatně :/');
    setTimeout(() => setMessage(null), 1200);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Lekce: Co je burza?</Text>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.btn} onPress={() => setSelected('Info')}>
          <Text>Info</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => setSelected('Question')}>
          <Text>Otázka</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => setSelected('Calc')}>
          <Text>Výpočet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => setSelected('Game')}>
          <Text>Minihra</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => setSelected('Match')}>
          <Text>Přiřazování</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.clear]} onPress={() => setSelected(null)}>
          <Text>Skrýt</Text>
        </TouchableOpacity>
      </View>

      {message && <Text style={styles.msg}>{message}</Text>}

      <View style={styles.exercise}>
        {selected === null && (
          <Text style={styles.note}>Vyber cvičení výše, aby se zobrazilo zde.</Text>
        )}

        {selected === 'Info' && (
          <Info title="Co je burza?" content="Burza je organizované místo, kde se obchodují akcie." icon="💡" onAnswered={handleAnswered} />
        )}

        {selected === 'Question' && (
          <Question question="Jak se jmenuje místo pro obchod s akciemi?" a1="Trh" a2="Knihovna" a3="Burza" a4="Obchod" correct="Burza" onAnswered={(ok: boolean) => handleAnswered(ok,0)} />
        )}

        {selected === 'Calc' && (
          <Calc question="Kolik je 2+2" correct={4} onAnswered={(ok: boolean) => handleAnswered(ok,0)} typeResult="numeric" />
        )}

        {selected === 'Game' && (
          <Game question="Burza nebo trh?" optionOneName="Burza" optionTwoName="Trh" optionOneItems={["Akcie Apple", "Akcie Tesla"]} optionTwoItems={["Jablko", "mrkev"]} onAnswered={(ok: boolean) => handleAnswered(ok,1)} />
        )}

        {selected === 'Match' && (
          <MatchExercise options={["Jablko", "Banán", "Mrkev"]} labels={["Červené ovoce", "Žluté ovoce", "Oranžové ovoce"]} onAnswered={(ok: boolean) => handleAnswered(ok,1)} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center' },
  header: { fontSize: 22, fontWeight: '700', color: '#850F8D', marginBottom: 12 },
  menu: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 12 },
  btn: { backgroundColor: '#F0F0F0', padding: 10, margin: 6, borderRadius: 8 },
  clear: { backgroundColor: '#DDD' },
  exercise: { width: '100%', alignItems: 'center', marginTop: 8 },
  note: { color: '#666' },
  msg: { marginBottom: 8, color: '#085' }
});
