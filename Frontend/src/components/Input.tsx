import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { theme } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'search';
  leftIcon?: React.ReactNode;
}

export interface InputRef {
  focus: () => void;
  blur: () => void;
}

export const Input = forwardRef<InputRef, InputProps>(
  (
    {
      label,
      error,
      containerStyle,
      variant = 'default',
      leftIcon,
      style,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const isSearch = variant === 'search';

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
    }));

    const handleFocus = (e: any) => {
      setIsFocused(true);
      onFocus && onFocus(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlur && onBlur(e);
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputContainer,
            variant === 'default' && styles.defaultContainer,
            isSearch && styles.searchContainer,
            isFocused && styles.focused,
            error ? { borderColor: theme.colors.error } : {},
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <TextInput
            ref={inputRef}
            style={[styles.input, style]}
            placeholderTextColor={theme.colors.textMuted}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.sm,
  },
  label: {
    color: '#94A3B8', // More subtle color
    fontSize: 12, // Slightly larger but less bold
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.4)', // Slightly transparent background
    paddingHorizontal: theme.spacing.md,
  },
  defaultContainer: {
    height: 48, // Reduced from 52
    borderRadius: 10, // Matches button
    borderWidth: 1, // Reduced from 1.5
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchContainer: {
    height: 44, // Reduced from 48
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  focused: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  leftIcon: {
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14, // Reduced from 16 for cleaner look
    height: '100%',
  },

  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: theme.spacing.xs,
  },
});
