import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  active = false,
  style,
  textStyle,
  icon,
}) => {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isPill = variant === 'pill';

  const getGradientColors = (): readonly [string, string] => {
    if (disabled) return ['#334155', '#1E293B'] as const;
    if (variant === 'secondary') return theme.gradients.secondary;
    return theme.gradients.primary;
  };

  const getButtonHeight = () => {
    if (isPill) return size === 'sm' ? 36 : 40;

    switch (size) {
      case 'sm': return 36;
      case 'lg': return 56;
      default: return 50;
    }
  };

  const getFontSize = () => {
    if (isPill) return size === 'sm' ? 12 : 14;

    switch (size) {
      case 'sm': return 12;
      case 'lg': return 18;
      default: return 16;
    }
  };

  const getBorderRadius = () => {
    if (isPill) return 9999;
    if (variant === 'primary' || variant === 'secondary') return 12;
    return theme.borderRadius.md;
  };

  const shadowStyle = (variant === 'primary' && !disabled) ? {
    shadowColor: '#2563FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  } : {};

  const getPillStyle = () => {
    if (!isPill) return {};
    if (active) {
      return {
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 0,
      };
    }
    return {
      backgroundColor: '#1E293B',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    };
  };

  const getPillTextStyle = () => {
    if (!isPill) return {};
    if (active) return { color: '#FFFFFF' };
    return { color: '#94A3B8' };
  };

  const renderContent = () => {
    const textColor =
      isOutline ? theme.colors.primary :
        isGhost ? theme.colors.success :
          isPill ? (getPillTextStyle().color ?? '#FFFFFF') :
            disabled ? '#64748B' :
              '#FFFFFF';

    return loading ? (
      <ActivityIndicator color={textColor} />
    ) : (
      <Text
        style={[
          styles.text,
          { fontSize: getFontSize() },
          isOutline && { color: theme.colors.primary },
          isGhost && { color: theme.colors.success },
          isPill && getPillTextStyle(),
          disabled && { color: '#64748B' },
          textStyle,
        ]}
      >
        {title}
      </Text>
    );
  };

  if (isOutline) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.container,
          {
            height: getButtonHeight(),
            borderRadius: getBorderRadius(),
            borderWidth: 1.5,
            borderColor: disabled ? '#334155' : theme.colors.primary,
            backgroundColor: 'transparent',
          },
          style,
        ]}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  if (isGhost || isPill) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.container,
          {
            height: getButtonHeight(),
            borderRadius: getBorderRadius(),
            paddingHorizontal: isPill ? 16 : 0,
          },
          isPill && getPillStyle(),
          style,
        ]}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.container,
        {
          height: getButtonHeight(),
          borderRadius: getBorderRadius(),
        },
        shadowStyle,
        style
      ]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          { borderRadius: getBorderRadius() }
        ]}
      >
        {renderContent()}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
    flexDirection: 'row',
    gap: 8,
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
