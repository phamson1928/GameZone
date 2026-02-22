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
import { Users, Crosshair, Trophy, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import { Button } from '../components/Button';

const ONBOARDING_DATA = [
    {
        id: '1',
        title: 'KẾT NỐI ĐỈNH CAO',
        description: 'Khám phá hàng ngàn game thủ cùng trình độ. Không còn nỗi lo "leo rank" đơn độc.',
        icon: Users,
        colors: ['#2563FF', '#1E40AF'],
    },
    {
        id: '2',
        title: 'THIẾT LẬP CHIẾN TUYẾN',
        description: 'Tạo Zone riêng, quy định mức Rank và vai trò. Xây dựng đội hình hoàng kim của riêng bạn.',
        icon: Crosshair,
        colors: ['#7C3AED', '#4C1D95'],
    },
    {
        id: '3',
        title: 'CHINH PHỤC VINH QUANG',
        description: 'Trò chuyện, phối hợp và phá đảo mọi bảng xếp hạng cùng những người đồng đội mới.',
        icon: Trophy,
        colors: ['#F59E0B', '#B45309'],
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
                    <LinearGradient
                        colors={item.colors as any}
                        style={styles.iconBg}
                    >
                        <Icon size={width * 0.3} color="#FFFFFF" strokeWidth={1.5} />
                    </LinearGradient>
                    {/* Subtle glow effect behind icon */}
                    <View style={[styles.glow, { backgroundColor: item.colors[0] }]} />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
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
                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={finishOnboarding}
                    activeOpacity={0.7}
                >
                    <Text style={styles.skipText}>Bỏ qua</Text>
                </TouchableOpacity>

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
    skipButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 24,
        zIndex: 10,
        padding: 8,
    },
    skipText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '600',
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    imageContainer: {
        flex: 0.6,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    iconBg: {
        width: 200,
        height: 200,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    glow: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        opacity: 0.1,
        zIndex: 1,
    },
    textContainer: {
        flex: 0.3,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 1,
    },
    description: {
        fontSize: 15,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    pagination: {
        flexDirection: 'row',
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
        marginHorizontal: 4,
    },
    nextButton: {
        width: '100%',
    },
});
