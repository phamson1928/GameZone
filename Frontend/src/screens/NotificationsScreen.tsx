import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Container } from '../components/Container';
import { theme } from '../theme';

export const NotificationsScreen = () => {
  return (
    <Container>
      <View style={styles.container}>
        <Text style={styles.text}>Notifications available in the popup!</Text>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  text: {
    color: theme.colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
});
