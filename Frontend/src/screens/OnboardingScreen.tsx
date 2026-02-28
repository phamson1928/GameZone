import { Image } from 'expo-image';
import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    useWindowDimensions,
    TouchableOpacity,
    Animated,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Crosshair, Trophy, ChevronRight, Gamepad2, MessageSquare, Bot } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import { Button } from '../components/Button';

const ONBOARDING_DATA = [
    {
        id: '1',
        title: 'TÌM KIẾM ĐỒNG ĐỘI',
        description: 'Kết nối hàng nghìn game thủ cùng nhịp đập. Không còn nỗi lo "leo rank" đơn độc.',
        icon: Gamepad2,
        colors: ['#2563FF', '#1E40AF'],
        accent: '#3B82F6',
    },
    {
        id: '2',
        title: 'CHIẾN THUẬT RÕ RÀNG',
        description: 'Tạo vùng chiến sự (Zone), thiết lập yêu cầu trình độ, và định hình đội hình trong mơ của bạn.',
        icon: Crosshair,
        colors: ['#7C3AED', '#4C1D95'],
        accent: '#8B5CF6',
    },
    {
        id: '3',
        title: 'TRÒ CHUYỆN REAL-TIME',
        description: 'Lên kế hoạch tác chiến ngay lập tức với hệ thống chat nhóm tốc độ bàn thờ.',
        icon: MessageSquare,
        colors: ['#E11D48', '#881337'],
        accent: '#F43F5E',
    },
    {
        id: '4',
        title: 'CHINH PHỤC ĐỈNH CAO',
        description: 'Xóa bỏ mọi giới hạn, kề vai sát cánh cùng những người anh em mới để đạt chuỗi thắng bất bại.',
        icon: Trophy,
        colors: ['#F59E0B', '#B45309'],
        accent: '#FBBF24',
    },
];

export const OnboardingScreen = ({ navigation }: any) => {
    const { width, height } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleNext = async () => {
        if (currentIndex < ONBOARDING_DATA.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            await finishOnboarding();
        }
    };

    const finishOnboarding = async () => {
        try {
            console.log('Finishing onboarding...');
            await AsyncStorage.setItem('@onboarding_completed', 'true');
            navigation.replace('App');
        } catch (err) {
            console.log('Error saving onboarding state:', err);
            navigation.replace('App');
        }
    };

    const renderItem = ({ item }: { item: typeof ONBOARDING_DATA[0] }) => {
        const Icon = item.icon;
        return (
            <View style={[styles.slide, { width }]}>
                <View style={styles.imageContainer}>
                    {/* MASCOT PLACEHOLDER */}
                    <View style={styles.mascotPlaceholderBox}>
                        <LinearGradient
                            colors={item.colors as any}
                            style={styles.mascotGradientBg}
                        />
                        <View style={[styles.mascotBackGlow, { backgroundColor: item.accent }]} />

                        {/* Hình ảnh Mascot có thể thế vào đây bằng <Image  contentFit="cover" transition={500} cachePolicy="disk"/> */}
                        <Bot size={80} color="#FFFFFF" style={styles.mascotFallbackIcon} />

                        <View style={styles.mascotFloatIcon}>
                            <Icon size={32} color={item.accent} />
                        </View>
                        <Text style={styles.mascotHintText}>[ Mascot Image Here ]</Text>
                    </View>
                </View>

                <View style={styles.textContainer}>
                    <Text style={[styles.title, { textShadowColor: item.accent }]}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0F172A', '#111827']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.headerRow}>
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>TeamZoneVN</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={finishOnboarding}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.skipText}>BỎ QUA</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={ONBOARDING_DATA}
                    renderItem={renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    ref={slidesRef}
                />

                <View style={styles.footer}>
                    {/* Pagination */}
                    <View style={styles.pagination}>
                        {ONBOARDING_DATA.map((_, i) => {
                            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                            const dotWidth = scrollX.interpolate({
                                inputRange,
                                outputRange: [10, 24, 10],
                                extrapolate: 'clamp',
                            });
                            const opacity = scrollX.interpolate({
                                inputRange,
                                outputRange: [0.3, 1, 0.3],
                                extrapolate: 'clamp',
                            });
                            return (
                                <Animated.View
                                    style={[styles.dot, { width: dotWidth, opacity }]}
                                    key={i.toString()}
                                />
                            );
                        })}
                    </View>

                    {/* Button */}
                    <Button
                        title={currentIndex === ONBOARDING_DATA.length - 1 ? 'BẮT ĐẦU NGAY' : 'TIẾP THEO'}
                        onPress={handleNext}
                        variant="primary"
                        style={styles.nextButton}
                        icon={currentIndex < ONBOARDING_DATA.length - 1 ? <ChevronRight size={20} color="#FFF" /> : null}
                    />
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    safeArea: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: Platform.OS === 'ios' ? 10 : 20,
        zIndex: 10,
    },
    logoPlaceholder: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    logoText: {
        color: '#E2E8F0',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
    },
    skipButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    skipText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    imageContainer: {
        flex: 0.65,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    mascotPlaceholderBox: {
        width: 250,
        height: 320,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mascotGradientBg: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 30,
        opacity: 0.8,
        transform: [{ rotate: '-3deg' }],
    },
    mascotBackGlow: {
        position: 'absolute',
        width: 220,
        height: 280,
        borderRadius: 30,
        opacity: 0.4,
        transform: [{ rotate: '5deg' }],
        filter: [{ blur: 20 }] as any, // Only works nicely on some platforms, acceptable fallback
    },
    mascotFallbackIcon: {
        marginBottom: 20,
        opacity: 0.9,
    },
    mascotFloatIcon: {
        position: 'absolute',
        bottom: -15,
        right: -15,
        backgroundColor: '#1E293B',
        padding: 16,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#0F172A',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    mascotHintText: {
        position: 'absolute',
        bottom: 20,
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
    textContainer: {
        flex: 0.35,
        alignItems: 'center',
        paddingTop: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 1.5,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    description: {
        fontSize: 15,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
        fontWeight: '500',
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 20 : 40,
    },
    pagination: {
        flexDirection: 'row',
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 5,
    },
    nextButton: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        elevation: 5,
        shadowColor: '#2563FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
});
