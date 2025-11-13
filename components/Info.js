import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Info({ title, content, icon, onAnswered }) {
  const hasCalledRef = useRef(false);
  useEffect(() => {
    if (onAnswered && !hasCalledRef.current) {
      hasCalledRef.current = true;
      onAnswered(true, 2);
    }
  }, [onAnswered]);

  return (
    <View style={styles.banner}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <View style={styles.content}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.text}>{content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: '#F8F9D7', padding: 16, borderRadius: 12, flexDirection: 'row', gap: 12, alignItems: 'center' },
  icon: { fontSize: 32 },
  title: { fontSize: 18, fontWeight: '700', color: '#850F8D' },
  text: { color: '#333' }
});
