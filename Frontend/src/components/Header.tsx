import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    rightComponent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = false, rightComponent }) => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.leftContainer}>
                {showBack && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                )}
            </View>
            <Text style={styles.title} numberOfLines={1}>
                {title}
            </Text>
            <View style={styles.rightContainer}>
                {rightComponent}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    leftContainer: {
        width: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    backButton: {
        padding: theme.spacing.xs,
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    rightContainer: {
        width: 40,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
});
