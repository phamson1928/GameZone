import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Container } from '../components/Container';
import { theme } from '../theme';

export const GroupsScreen = () => {
  return (
    <Container>
      <View style={styles.center}>
        <Text style={styles.title}>My Squads</Text>
        <Text style={styles.text}>
          Connect with your teams and start the mission.
        </Text>
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>
            Feature coming soon in the next update.
          </Text>
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    padding: theme.spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
  },
  text: {
    color: theme.colors.slate,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  placeholderCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    ...theme.shadows.sm,
  },
  placeholderText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});
