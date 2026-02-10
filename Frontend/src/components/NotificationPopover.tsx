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
import { Users, Settings, Info, X, BellOff } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

// Types for notification data
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'invite' | 'system';
}

interface NotificationPopoverProps {
  visible: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onPressItem?: (item: NotificationItem) => void;
}

const { width } = Dimensions.get('window');

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  visible,
  onClose,
  notifications,
  onPressItem
}) => {
  
  const renderItem = ({ item }: { item: NotificationItem }) => {
    let IconComponent = Info;
    if (item.type === 'invite') IconComponent = Users;
    if (item.type === 'system') IconComponent = Settings;

    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem, 
          !item.read && styles.unreadItem
        ]}
        onPress={() => onPressItem && onPressItem(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.read ? '#F0F0F0' : '#E8F4F8' }]}>
          <IconComponent 
            size={20} 
            color={item.read ? COLORS.textSecondary : COLORS.primary} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, !item.read && styles.unreadText]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        {!item.read && <View style={styles.dot} />}
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
            {/* Little triangle pointing up to the bell */}
            <View style={styles.arrowUp} />
            
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
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
                <BellOff size={40} color={COLORS.slate} />
                <Text style={styles.emptyText}>No new notifications</Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.footer} onPress={() => {
                // Navigate to full history if needed, or just close
                onClose();
            }}>
                <Text style={styles.footerText}>Mark all as read</Text>
            </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)', // Dim background slightly
    justifyContent: 'flex-start',
    alignItems: 'flex-end', // Align to right side
  },
  popoverContainer: {
    width: width * 0.85, // 85% of screen width
    maxWidth: 340,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    marginTop: 100, // Approximate header height + status bar
    marginRight: 16, // Spacing from right edge
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden', // Keeps children inside rounded corners
  },
  arrowUp: {
    position: 'absolute',
    top: -10,
    right: 20, // Align with bell icon roughly
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.background, // Match container bg
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  listContent: {
    maxHeight: 350, // Limit height so it doesn't take over screen
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  unreadItem: {
    backgroundColor: '#FAFDFE',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    color: COLORS.text,
    marginBottom: 2,
  },
  unreadText: {
    color: COLORS.primary,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: COLORS.slate,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary, // Green dot for "new"
    marginTop: 6,
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginLeft: 60, // Indent separator
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  }
});
