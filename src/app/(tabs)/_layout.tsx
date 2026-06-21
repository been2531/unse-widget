import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const GOLD = '#C8A84B';

const TABS = [
  { name: 'index',      label: '홈',    icon: '⌂' },
  { name: 'fortune',    label: '운세',   icon: '☽' },
  { name: 'gacha',      label: '가챠',   icon: '✦' },
  { name: 'collection', label: '컬렉션', icon: '⊞' },
  { name: 'coin-shop',  label: '상점',   icon: '⊙' },
] as const;

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(bottom, 8) }]}>
      {TABS.map((tab, i) => {
        const focused = state.index === i;
        return (
          <Pressable
            key={tab.name}
            style={styles.tab}
            onPress={() => navigation.navigate(tab.name)}
            accessibilityLabel={tab.label}
          >
            {focused && <View style={styles.indicator} />}
            <Text style={[styles.icon, focused && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      {TABS.map(tab => (
        <Tabs.Screen key={tab.name} name={tab.name} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(8,6,20,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    gap: 3,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: GOLD,
    borderRadius: 1,
  },
  icon: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.30)',
  },
  iconActive: {
    color: GOLD,
  },
  label: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.30)',
    fontWeight: '600',
  },
  labelActive: {
    color: GOLD,
    fontWeight: '800',
  },
});
