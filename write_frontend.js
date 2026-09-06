const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = 'e:\\projects\\glunity-app\\glunity-app';

// 1. Create referralQueries.ts
const referralQueriesPath = path.join(FRONTEND_DIR, 'src', 'queries', 'referrals', 'referralQueries.ts');
const referralQueriesCode = `import { useQuery } from '@tanstack/react-query';
import client from '~/api/client';

export interface ReferralStats {
  referral_code: string;
  referral_link: string;
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  points_earned: number;
}

export interface ReferralHistoryItem {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FLAGGED';
  points_awarded: number;
  created_at: string;
  completed_at: string | null;
}

export interface ReferralHistoryResponse {
  referrals: ReferralHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export const useMyReferral = () => {
  return useQuery({
    queryKey: ['myReferral'],
    queryFn: async () => {
      const response = await client.get<{ success: boolean; data: ReferralStats }>('/referrals/me');
      return response.data.data;
    },
  });
};

export const useReferralHistory = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['referralHistory', page, limit],
    queryFn: async () => {
      const response = await client.get<{ success: boolean; data: ReferralHistoryResponse }>(
        \`/referrals/history?page=\${page}&limit=\${limit}\`
      );
      return response.data.data;
    },
  });
};
`;

fs.mkdirSync(path.dirname(referralQueriesPath), { recursive: true });
fs.writeFileSync(referralQueriesPath, referralQueriesCode, 'utf8');
console.log('Created referralQueries.ts');

// 2. Create ReferralScreen.tsx
const referralScreenPath = path.join(FRONTEND_DIR, 'src', 'screens', 'referrals', 'ReferralScreen.tsx');
const referralScreenCode = `import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { useTheme } from '~/hooks/useTheme';
import { useMyReferral, useReferralHistory } from '~/queries/referrals/referralQueries';
import * as Clipboard from 'expo-clipboard';

export function ReferralScreen() {
  const { theme } = useTheme();
  const { data: stats, isLoading: statsLoading } = useMyReferral();
  const { data: history, isLoading: historyLoading } = useReferralHistory();

  const handleCopyCode = async () => {
    if (stats?.referral_code) {
      await Clipboard.setStringAsync(stats.referral_code);
      alert('Referral code copied to clipboard!');
    }
  };

  const handleCopyLink = async () => {
    if (stats?.referral_link) {
      await Clipboard.setStringAsync(stats.referral_link);
      alert('Referral link copied to clipboard!');
    }
  };

  const handleShare = async () => {
    if (stats?.referral_link) {
      try {
        await Share.share({
          message: \`Join me on Glunity: \${stats.referral_link}\`,
        });
      } catch (error) {
        console.error('Error sharing', error);
      }
    }
  };

  if (statsLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.header, { color: theme.colors.text }]}>REFER & EARN</Text>
        
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Your Referral Code:</Text>
        <View style={styles.row}>
          <Text style={[styles.code, { color: theme.colors.primary }]}>{stats?.referral_code}</Text>
          <TouchableOpacity onPress={handleCopyCode} style={[styles.button, { backgroundColor: theme.colors.card }]}>
            <Text style={{ color: theme.colors.primary }}>Copy</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 16 }]}>Your Referral Link:</Text>
        <View style={styles.row}>
          <Text style={[styles.link, { color: theme.colors.primary }]} numberOfLines={1}>
            {stats?.referral_link}
          </Text>
        </View>
        <View style={styles.row}>
          <TouchableOpacity onPress={handleCopyLink} style={[styles.button, { backgroundColor: theme.colors.card, flex: 1, marginRight: 8 }]}>
            <Text style={{ color: theme.colors.primary, textAlign: 'center' }}>Copy Link</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={[styles.button, { backgroundColor: theme.colors.primary, flex: 1, marginLeft: 8 }]}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.header, { color: theme.colors.text }]}>Referral Statistics</Text>
        <View style={[styles.statsGrid, { backgroundColor: theme.colors.card }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats?.total_referrals || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats?.successful_referrals || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Successful</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats?.pending_referrals || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Pending</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats?.points_earned || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Points</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.header, { color: theme.colors.text }]}>Referral History</Text>
        {historyLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          history?.referrals.map((ref) => (
            <View key={ref.id} style={[styles.historyItem, { borderBottomColor: theme.colors.border }]}>
              <View>
                <Text style={[styles.historyTitle, { color: theme.colors.text }]}>
                  {ref.status === 'COMPLETED' ? 'Successful Referral' : 'Pending Referral'}
                </Text>
                <Text style={[styles.historyDate, { color: theme.colors.textSecondary }]}>
                  {new Date(ref.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.historyPoints, { color: ref.points_awarded > 0 ? theme.colors.success : theme.colors.textSecondary }]}>
                +{ref.points_awarded} pts
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { padding: 16 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  label: { fontSize: 14, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  code: { fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },
  link: { fontSize: 16, flex: 1 },
  button: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 12, padding: 16 },
  statBox: { width: '50%', padding: 8, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  historyTitle: { fontSize: 16, fontWeight: '500' },
  historyDate: { fontSize: 12, marginTop: 4 },
  historyPoints: { fontSize: 16, fontWeight: 'bold' },
});
`;

fs.mkdirSync(path.dirname(referralScreenPath), { recursive: true });
fs.writeFileSync(referralScreenPath, referralScreenCode, 'utf8');
console.log('Created ReferralScreen.tsx');

// 3. Update RootNavigator.tsx
const rootNavPath = path.join(FRONTEND_DIR, 'src', 'navigation', 'RootNavigator.tsx');
let rootNavCode = fs.readFileSync(rootNavPath, 'utf8');

if (!rootNavCode.includes('ReferralScreen')) {
  rootNavCode = rootNavCode.replace(
    `import { AirdropPointsScreen } from '~/screens/points/AirdropPointsScreen';`,
    `import { AirdropPointsScreen } from '~/screens/points/AirdropPointsScreen';\nimport { ReferralScreen } from '~/screens/referrals/ReferralScreen';`
  );
  
  rootNavCode = rootNavCode.replace(
    `AirdropPoints: undefined;`,
    `AirdropPoints: undefined;\n  Referrals: undefined;`
  );

  rootNavCode = rootNavCode.replace(
    `<Stack.Screen name="AirdropPoints" component={AirdropPointsScreen} options={{ title: 'Airdrop Points' }} />`,
    `<Stack.Screen name="AirdropPoints" component={AirdropPointsScreen} options={{ title: 'Airdrop Points' }} />\n        <Stack.Screen name="Referrals" component={ReferralScreen} options={{ title: 'Referrals' }} />`
  );

  fs.writeFileSync(rootNavPath, rootNavCode, 'utf8');
  console.log('Updated RootNavigator.tsx');
} else {
  console.log('RootNavigator.tsx already contains ReferralScreen');
}
