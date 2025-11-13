import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Note: Full drag-and-drop parity is non-trivial in RN; this component provides a simplified matching UI

export default function MatchExercise({ options, labels, onAnswered }) {
  const answeredItems = useRef(new Set());
  const [slots, setSlots] = useState(Object.fromEntries(labels.map((_, i) => [`slot${i}`, null])));
  const freeItems = options.filter(id => !Object.values(slots).includes(id));

  function handlePlace(itemId, slotIndex) {
    if (answeredItems.current.has(itemId)) return;
    const isCorrect = options[slotIndex] === itemId;
    answeredItems.current.add(itemId);
    setSlots(prev => ({ ...prev, [`slot${slotIndex}`]: itemId }));
    onAnswered && onAnswered(isCorrect, 1);
    const allFilled = Object.values({ ...slots, [`slot${slotIndex}`]: itemId }).every(v => v != null);
    if (allFilled) onAnswered && onAnswered(true, 0);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.question}>Přiřaď správně:</Text>
      <View style={styles.pool}>
        {freeItems.map(id => <Text key={id} style={styles.item}>{id}</Text>)}
      </View>
      <View>
        {labels.map((label, i) => (
          <View key={i} style={styles.slotRow}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.slot}><Text>{slots[`slot${i}`]}</Text></View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ container: { padding: 8 }, question: { fontWeight: '700', color: '#850F8D', marginBottom: 8 }, pool: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, item: { backgroundColor: '#fff', borderWidth: 1, padding: 8, borderRadius: 6, margin: 4 }, slotRow: { marginVertical: 6 }, label: { marginBottom: 6 }, slot: { minHeight: 36, backgroundColor: '#F8F9D7', borderRadius: 8, padding: 6 } });
