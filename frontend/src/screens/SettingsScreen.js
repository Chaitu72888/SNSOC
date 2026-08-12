import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { API_BASE_URL } from '../config';

// Theme Tokens
const colors = {
  bgDark: '#0d1117',
  bgCard: '#161b22',
  textMain: '#e6edf3',
  textMuted: '#7d8590',
  textWhite: '#ffffff',
  accentBlue: '#1f6feb',
  borderColor: '#30363d',
  crit: '#f85149',
  critBg: 'rgba(248, 81, 73, 0.15)',
  high: '#e3b341',
  highBg: 'rgba(227, 179, 65, 0.15)',
  low: '#3fb950',
  lowBg: 'rgba(63, 185, 80, 0.15)',
};

// Shared Card & Badge Components
const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const Badge = ({ label, color, bg }) => (
  <View style={[styles.badge, { backgroundColor: bg || 'rgba(255,255,255,0.05)', borderColor: color || colors.borderColor }]}>
    <Text style={[styles.badgeText, { color: color || colors.textMain }]}>{label}</Text>
  </View>
);

export default function SettingsScreen() {
  // Existing Preferences
  const [pushAlerts, setPushAlerts] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  // SECTION A: Data Usage Settings
  const [lowDataMode, setLowDataMode] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState('30s');
  const [wifiOnlySync, setWifiOnlySync] = useState(true);

  // SECTION B: Platform Sync Status State
  const [lastSyncTime, setLastSyncTime] = useState('2 mins ago');
  const [lastTransferredKB, setLastTransferredKB] = useState(24.5);
  const [syncStatus, setSyncStatus] = useState('In Sync');

  // SECTION C: Data Consumption Summary State
  const [androidWeeklyMB, setAndroidWeeklyMB] = useState(4.12);
  const [webWeeklyMB, setWebWeeklyMB] = useState(8.94);
  const [alertThresholdMB, setAlertThresholdMB] = useState('50');

  const totalWeeklyMB = androidWeeklyMB + webWeeklyMB;
  const androidPercentage = Math.round((androidWeeklyMB / (totalWeeklyMB || 1)) * 100);
  const webPercentage = 100 - androidPercentage;

  useEffect(() => {
    loadBackendData();
  }, []);

  const loadBackendData = async () => {
    try {
      // 1. Fetch Settings
      const setRes = await fetch(`${API_BASE_URL}/api/telemetry/settings`);
      if (setRes.ok) {
        const sJson = await setRes.json();
        const s = sJson.data;
        setLowDataMode(s.low_data_mode);
        setRefreshInterval(s.refresh_interval);
        setWifiOnlySync(s.wifi_only_sync);
        setAlertThresholdMB(s.alert_threshold_mb.toString());
      }

      // 2. Fetch Sync Status
      const syncRes = await fetch(`${API_BASE_URL}/api/telemetry/sync`, {
        headers: { 'X-Platform': 'Android App' },
      });
      if (syncRes.ok) {
        const syncJson = await syncRes.json();
        const syncData = syncJson.data;
        const diffSec = Math.floor(Date.now() / 1000 - syncData.last_sync);
        setLastSyncTime(diffSec < 60 ? 'Just now' : `${Math.floor(diffSec / 60)} mins ago`);
        setLastTransferredKB(parseFloat((syncData.last_transferred_bytes / 1024).toFixed(1)));
        setSyncStatus(syncData.sync_status);
      }

      // 3. Fetch Consumption Summary
      const conRes = await fetch(`${API_BASE_URL}/api/telemetry/consumption`);
      if (conRes.ok) {
        const cJson = await conRes.json();
        const c = cJson.data;
        setAndroidWeeklyMB(c.android_weekly_mb);
        setWebWeeklyMB(c.web_weekly_mb);
      }
    } catch (e) {
      console.log('Settings load error:', e);
    }
  };

  const handleManualSync = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/telemetry/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Platform': 'Android App',
        },
        body: JSON.stringify({ platform: 'Android App', bytes_transferred: Math.floor(Math.random() * 15000 + 10000) }),
      });
      if (res.ok) {
        setLastSyncTime('Just now');
        setLastTransferredKB(parseFloat((Math.random() * 10 + 15).toFixed(1)));
        setSyncStatus('In Sync');
        Alert.alert('Platform Sync Complete', 'Synced venue mobile state with Flask backend and Web Dashboard.');
      }
    } catch (e) {
      Alert.alert('Sync Failed', 'Could not reach Flask server.');
    }
  };

  const handleSaveSettings = async (updates) => {
    try {
      await fetch(`${API_BASE_URL}/api/telemetry/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.log('Save settings error:', e);
    }
  };

  const handleSaveThreshold = async () => {
    await handleSaveSettings({ alert_threshold_mb: parseFloat(alertThresholdMB) || 50 });
    Alert.alert('Threshold Updated', `Alert will trigger if weekly mobile usage exceeds ${alertThresholdMB} MB.`);
  };


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Title & Subtitle */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Settings & Platform Sync</Text>
        <Text style={styles.screenSubtitle}>
          SNSOC Operational Preferences & Android Data Consumption Management
        </Text>
      </View>

      {/* ACCOUNT & SECURITY CARD */}
      <Card>
        <Text style={styles.cardSubtitle}>OPERATOR ACCOUNT & SECURITY</Text>
        <View style={styles.accountRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>SC</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountName}>sivachaitanya72@gmail.com</Text>
            <Text style={styles.accountRole}>Role: Lead SOC Security Specialist</Text>
          </View>
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>Push Notifications for Critical Alerts</Text>
          <Switch
            value={pushAlerts}
            onValueChange={setPushAlerts}
            trackColor={{ false: colors.borderColor, true: colors.accentBlue }}
            thumbColor={colors.textWhite}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>Biometric Authentication (Fingerprint / Face Unlock)</Text>
          <Switch
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
            trackColor={{ false: colors.borderColor, true: colors.accentBlue }}
            thumbColor={colors.textWhite}
          />
        </View>
      </Card>

      {/* SECTION A: Data Usage Settings Card */}
      <Card>
        <Text style={styles.cardSubtitle}>DATA USAGE SETTINGS</Text>
        <Text style={styles.cardDesc}>
          Configure data optimization policies to control network usage across venue mobile networks.
        </Text>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.toggleText}>Low Data Mode</Text>
            <Text style={styles.toggleSub}>Reduces background packet polling frequency</Text>
          </View>
          <Switch
            value={lowDataMode}
            onValueChange={(val) => {
              setLowDataMode(val);
              handleSaveSettings({ low_data_mode: val });
            }}
            trackColor={{ false: colors.borderColor, true: colors.accentBlue }}
            thumbColor={colors.textWhite}
          />
        </View>

        {/* Data Refresh Interval Picker */}
        <Text style={styles.inputLabel}>Data Refresh Interval</Text>
        <View style={styles.chipRow}>
          {['30s', '1min', '5min'].map(interval => (
            <TouchableOpacity
              key={interval}
              style={[
                styles.chip,
                refreshInterval === interval && styles.chipActive,
              ]}
              onPress={() => {
                setRefreshInterval(interval);
                handleSaveSettings({ refresh_interval: interval });
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  refreshInterval === interval && styles.chipTextActive,
                ]}
              >
                {interval}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.toggleRow, { marginTop: 16 }]}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.toggleText}>Sync on Wi-Fi Only</Text>
            <Text style={styles.toggleSub}>Prevents heavy log sync over cellular data</Text>
          </View>
          <Switch
            value={wifiOnlySync}
            onValueChange={(val) => {
              setWifiOnlySync(val);
              handleSaveSettings({ wifi_only_sync: val });
            }}
            trackColor={{ false: colors.borderColor, true: colors.accentBlue }}
            thumbColor={colors.textWhite}
          />
        </View>
      </Card>

      {/* SECTION B: Platform Sync Status Card */}
      <Card>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardSubtitle}>PLATFORM SYNC STATUS</Text>
          <Badge
            label={syncStatus}
            color={syncStatus === 'In Sync' ? colors.low : colors.crit}
            bg={syncStatus === 'In Sync' ? colors.lowBg : colors.critBg}
          />
        </View>
        <Text style={styles.cardDesc}>
          Real-time telemetry synchronization between Android Mobile App and Web Dashboard.
        </Text>

        <View style={styles.metricGrid}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>LAST SYNC TIMESTAMP</Text>
            <Text style={styles.metricValue}>{lastSyncTime}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>DATA TRANSFERRED</Text>
            <Text style={styles.metricValue}>{lastTransferredKB} KB</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.buttonSecondary}
          activeOpacity={0.8}
          onPress={handleManualSync}
        >
          <Text style={styles.buttonSecondaryText}>🔄 Force Manual Sync Now</Text>
        </TouchableOpacity>
      </Card>

      {/* SECTION C: Data Consumption Summary Card */}
      <Card>
        <Text style={styles.cardSubtitle}>DATA CONSUMPTION SUMMARY</Text>
        <Text style={styles.cardDesc}>
          Weekly venue management telemetry comparison: Android Venue App vs. Web Dashboard.
        </Text>

        {/* Two Stat Blocks Side-by-Side */}
        <View style={styles.statRow}>
          <View style={[styles.statCard, { borderColor: colors.accentBlue }]}>
            <Text style={styles.statTitle}>🤖 Android App</Text>
            <Text style={[styles.statValue, { color: colors.accentBlue }]}>{androidWeeklyMB} MB</Text>
            <Text style={styles.statSub}>This Week</Text>
          </View>

          <View style={[styles.statCard, { borderColor: '#8b5cf6' }]}>
            <Text style={styles.statTitle}>🖥 Web Dashboard</Text>
            <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{webWeeklyMB} MB</Text>
            <Text style={styles.statSub}>This Week</Text>
          </View>
        </View>

        {/* Platform Comparison Bar */}
        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Consumption Ratio</Text>
        <View style={styles.barContainer}>
          <View style={[styles.barAndroid, { width: `${androidPercentage}%` }]} />
          <View style={[styles.barWeb, { width: `${webPercentage}%` }]} />
        </View>
        <View style={styles.barLegendRow}>
          <Text style={styles.barLegendText}>🤖 Android App: {androidPercentage}%</Text>
          <Text style={styles.barLegendText}>🖥 Web: {webPercentage}%</Text>
        </View>

        {/* Threshold Alert Setting */}
        <Text style={[styles.inputLabel, { marginTop: 20 }]}>
          Alert Threshold (MB / Week)
        </Text>
        <View style={styles.thresholdRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            keyboardType="numeric"
            value={alertThresholdMB}
            onChangeText={setAlertThresholdMB}
            placeholder="e.g. 50"
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={styles.buttonSmall}
            activeOpacity={0.8}
            onPress={handleSaveThreshold}
          >
            <Text style={styles.buttonText}>Set Threshold</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textWhite,
  },
  screenSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderColor: colors.borderColor,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.textWhite,
    fontWeight: '700',
    fontSize: 16,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textWhite,
  },
  accountRole: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 44,
  },
  toggleText: {
    fontSize: 14,
    color: colors.textMain,
    fontWeight: '500',
  },
  toggleSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.bgDark,
    borderColor: colors.borderColor,
    borderWidth: 1,
    borderRadius: 6,
    color: colors.textMain,
    paddingHorizontal: 16,
    minHeight: 48,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderColor,
    backgroundColor: colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.accentBlue,
    borderColor: colors.accentBlue,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.textWhite,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: colors.bgDark,
    borderColor: colors.borderColor,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textWhite,
  },
  buttonSecondary: {
    backgroundColor: colors.bgDark,
    borderColor: colors.borderColor,
    borderWidth: 1,
    minHeight: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    color: colors.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgDark,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  barContainer: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 8,
  },
  barAndroid: {
    height: '100%',
    backgroundColor: colors.accentBlue,
  },
  barWeb: {
    height: '100%',
    backgroundColor: '#8b5cf6',
  },
  barLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  barLegendText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  thresholdRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  buttonSmall: {
    backgroundColor: colors.accentBlue,
    minHeight: 48,
    borderRadius: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
