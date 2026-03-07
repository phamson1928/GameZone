import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Dimensions
} from 'react-native';
import { Users, Settings, Info, X, BellOff, CheckCircle2, XCircle, LogOut, UserPlus } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { NotificationItem } from '../types';

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

interface NotificationPopoverProps {
  visible: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onPressItem?: (item: NotificationItem) => void;
  onMarkAllRead?: () => void;
}

const { width } = Dimensions.get('window');

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  visible,
  onClose,
  notifications,
  onPressItem,
  onMarkAllRead
}) => {

  const renderItem = ({ item }: { item: NotificationItem }) => {
    let IconComponent = Info;
    let iconColor = COLORS.primary;
    let bgColor = COLORS.primary + '25';

    switch (item.type) {
      case 'JOIN_REQUEST':
        IconComponent = UserPlus;
        break;
      case 'REQUEST_APPROVED':
        IconComponent = CheckCircle2;
        iconColor = '#22C55E';
        bgColor = 'rgba(34,197,94,0.15)';
        break;
      case 'REQUEST_REJECTED':
        IconComponent = XCircle;
        iconColor = '#EF4444';
        bgColor = 'rgba(239,68,68,0.15)';
        break;
      case 'GROUP_FORMED':
        IconComponent = Users;
        break;
      case 'MEMBER_LEFT':
        IconComponent = LogOut;
        iconColor = '#F59E0B';
        bgColor = 'rgba(245,158,11,0.15)';
        break;
    }

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadItem
        ]}
        onPress={() => onPressItem && onPressItem(item)}
      >
        <View style={[
          styles.iconContainer,
          { backgroundColor: item.isRead ? 'rgba(255,255,255,0.06)' : bgColor }
        ]}>
          <IconComponent
            size={20}
            color={item.isRead ? COLORS.textMuted : iconColor}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, !item.isRead && styles.unreadText]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.data?.message && (
            <Text style={styles.message} numberOfLines={2}>
              {item.data.message}
            </Text>
          )}
          <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
        {!item.isRead && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.popoverContainer}>
          {/* Triangle arrow */}
          <View style={styles.arrowUp} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Thông báo</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {notifications.length > 0 ? (
            <FlatList
              data={notifications}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <BellOff size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Không có thông báo</Text>
            </View>
          )}

          <TouchableOpacity style={styles.footer} onPress={onMarkAllRead || onClose}>
            <Text style={styles.footerText}>Đánh dấu tất cả đã đọc</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  popoverContainer: {
    width: width * 0.85,
    maxWidth: 340,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    marginTop: 100,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  arrowUp: {
    position: 'absolute',
    top: -10,
    right: 20,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1E293B',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#131F35',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  listContent: {
    maxHeight: 350,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  unreadItem: {
    backgroundColor: 'rgba(37,99,255,0.05)',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  unreadText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 5,
    marginLeft: 6,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 64,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    backgroundColor: '#131F35',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});
