import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useColorScheme } from 'react-native';

import { ProfileButton } from './ProfileButton';

interface HeaderWithProfileProps {
  title: string;
  subtitle?: string;
}

export function HeaderWithProfile({ title, subtitle }: HeaderWithProfileProps) {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  
  return (
    <View style={styles.header}>
      <ProfileButton />
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colorScheme === 'dark' ? '#aaa' : '#666' }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  titleContainer: {
    marginLeft: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
});