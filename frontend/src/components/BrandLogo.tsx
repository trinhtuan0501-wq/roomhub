import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BrandLogo({ size = 'medium', showSubtext = true }: { size?: 'small' | 'medium' | 'large'; showSubtext?: boolean }) {
  const isSmall = size === 'small';
  const isLarge = size === 'large';
  
  const titleSize = isSmall ? 18 : isLarge ? 28 : 22;
  const subtextSize = isSmall ? 8 : isLarge ? 11 : 9;

  return (
    <View style={styles.container}>
      {/* Intertwined Symbol */}
      <View style={[styles.symbolContainer, { width: isSmall ? 28 : isLarge ? 40 : 34, height: isSmall ? 18 : isLarge ? 28 : 22 }]}>
        <View style={[styles.ring, styles.blueRing, { width: isSmall ? 16 : isLarge ? 24 : 20, height: isSmall ? 16 : isLarge ? 24 : 20 }]} />
        <View style={[styles.ring, styles.orangeRing, { width: isSmall ? 16 : isLarge ? 24 : 20, height: isSmall ? 16 : isLarge ? 24 : 20, left: isSmall ? 10 : isLarge ? 14 : 12 }]} />
      </View>
      
      {/* Brand Text */}
      <View style={styles.textContainer}>
        <Text style={[styles.titleText, { fontSize: titleSize }]}>
          <Text style={styles.blueText}>i</Text>
          <Text style={styles.orangeText}>Sinhvien</Text>
        </Text>
        
        {showSubtext && (
          <View style={styles.subtextRow}>
            <Text style={[styles.subtextOrange, { fontSize: subtextSize }]}>Giá tốt hơn</Text>
            <Text style={[styles.subtextBlue, { fontSize: subtextSize }]}>Chất lượng hơn</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symbolContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  blueRing: {
    borderColor: '#0ea5e9',
    top: 0,
    left: 0,
    zIndex: 2,
  },
  orangeRing: {
    borderColor: '#f97316',
    bottom: 0,
    zIndex: 1,
  },
  textContainer: {
    justifyContent: 'center',
  },
  titleText: {
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  blueText: {
    color: '#0ea5e9',
  },
  orangeText: {
    color: '#f97316',
  },
  subtextRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: -2,
  },
  subtextOrange: {
    color: '#f97316',
    fontWeight: 'bold',
  },
  subtextBlue: {
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
});
