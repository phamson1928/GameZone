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
}) => {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isPill = variant === 'pill';

  const getGradientColors = (): readonly [string, string] => {
    if (disabled) return ['#C8C8C8', '#AEAEAE'] as const;
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
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  } : {};

  const getPillStyle = () => {
    if (!isPill) return {};
    if (active) {
      return {
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 0,
      };
    }
    return {
      backgroundColor: '#f1f5f9',
      borderWidth: 0,
    };
  };

  const getPillTextStyle = () => {
    if (!isPill) return {};
    if (active) return { color: '#FFFFFF' };
    return { color: '#64748b' };
  };

  const renderContent = () => {
    const textColor = isOutline ? theme.colors.primary : 
                     isGhost ? theme.colors.secondary :
                     isPill ? getPillTextStyle().color :
                     '#FFFFFF';

    return loading ? (
      <ActivityIndicator color={textColor} />
    ) : (
      <Text
        style={[
          styles.text,
          { fontSize: getFontSize() },
          isOutline && { color: theme.colors.primary },
          isGhost && { color: theme.colors.secondary },
          isPill && getPillTextStyle(),
          textStyle,
        ]}
      >
        {title}
      </Text>
    );
  };

  if (isOutline || isGhost || isPill) {
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
          isOutline && { borderWidth: 1, borderColor: theme.colors.primary },
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
      activeOpacity={0.8}
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
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
