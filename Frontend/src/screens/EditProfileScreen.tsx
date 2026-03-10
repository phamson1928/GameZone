import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Save, UserX, Trash2 } from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';

import { Container } from '../components/Container';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../api/client';
import { theme } from '../theme';
import { STRINGS } from '../constants/strings';

const PLAY_STYLES = ['Vui vẻ', 'Cạnh tranh', 'Chill', 'Hardcore'];

export const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { user, updateUser, logout } = useAuthStore();

  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [playStyle, setPlayStyle] = useState(user?.profile?.playStyle || PLAY_STYLES[0]);
  const [timezone, setTimezone] = useState(user?.profile?.timezone || '');

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { bio: string; playStyle: string; timezone: string }) => {
      const response = await apiClient.patch('/users/me', data);
      return response.data;
    },
    onSuccess: (data) => {
      updateUser(data.data);
      Alert.alert('Thành công', 'Cập nhật hồ sơ thành công');
      navigation.goBack();
    },
    onError: (error) => {
      console.error('Update profile error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate({
      bio,
      playStyle,
      timezone,
    });
  };

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete('/users/me');
    },
    onSuccess: () => {
      Alert.alert('Thành công', 'Tài khoản của bạn đã được xóa hoàn toàn');
      logout();
    },
    onError: () => {
      Alert.alert('Lỗi', 'Không thể xóa tài khoản. Vui lòng thử lại.');
    },
  });

  const handleDeleteAccount = () => {
    Alert.alert(
      'Xóa tài khoản vĩnh viễn',
      'Hành động này không thể hoàn tác. Toàn bộ dữ liệu hồ sơ, game, zone, và tin nhắn của bạn sẽ bị xóa sạch.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa vĩnh viễn', style: 'destructive', onPress: () => deleteAccountMutation.mutate() },
      ]
    );
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phong cách chơi</Text>
          <View style={styles.playStyleContainer}>
            {PLAY_STYLES.map((style) => (
              <TouchableOpacity
                key={style}
                style={[
                  styles.playStyleOption,
                  playStyle === style && styles.playStyleOptionSelected,
                ]}
                onPress={() => setPlayStyle(style)}
              >
                <Text
                  style={[
                    styles.playStyleText,
                    playStyle === style && styles.playStyleTextSelected,
                  ]}
                >
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          label="Giới thiệu bản thân"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          containerStyle={styles.bioInput}
          placeholder="Viết gì đó về bạn..."
        />

        <Input
          label="Múi giờ"
          value={timezone}
          onChangeText={setTimezone}
          placeholder="VD: GMT+7"
        />

        <Button
          title="Lưu thay đổi"
          onPress={handleSave}
          style={styles.saveButton}
          loading={updateProfileMutation.isPending}
        />

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Vùng nguy hiểm</Text>

          <TouchableOpacity
            style={styles.dangerActionBlock}
            onPress={() => navigation.navigate('BlockedUsers' as never)}
          >
            <View style={styles.dangerIconBg}><UserX size={20} color={theme.colors.text} /></View>
            <View style={styles.dangerActionContent}>
              <Text style={styles.dangerActionTitle}>Quản lý người dùng bị chặn</Text>
              <Text style={styles.dangerActionSubtitle}>Xem danh sách và bỏ chặn người dùng</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
            disabled={deleteAccountMutation.isPending}
          >
            {deleteAccountMutation.isPending ? (
              <ActivityIndicator color={theme.colors.error} />
            ) : (
              <>
                <Trash2 size={20} color={theme.colors.error} />
                <Text style={styles.deleteAccountText}>Xóa tài khoản vĩnh viễn</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    color: theme.colors.accent,
    fontSize: 12,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  playStyleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  playStyleOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  playStyleOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  playStyleText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  playStyleTextSelected: {
    color: '#FFFFFF',
  },
  bioInput: {
    height: 120,
  },
  saveButton: {
    marginTop: theme.spacing.xl,
  },
  dangerZone: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.lg,
    gap: 16,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.error,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dangerActionBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dangerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dangerActionContent: {
    flex: 1,
  },
  dangerActionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerActionSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    gap: 12,
  },
  deleteAccountText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
