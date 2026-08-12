import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert as RNAlert,
} from 'react-native';
import { API_BASE_URL } from '../config';

// Theme & Tokens
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
  med: '#1f6feb',
  low: '#3fb950',
  lowBg: 'rgba(63, 185, 80, 0.15)',
};

// Reusable Shared Components
const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const Badge = ({ label, color, bg }) => (
  <View style={[styles.badge, { backgroundColor: bg || 'rgba(255,255,255,0.05)', borderColor: color || colors.borderColor }]}>
    <Text style={[styles.badgeText, { color: color || colors.textMain }]}>{label}</Text>
  </View>
);

export default function ThreatIntelScreen() {
  // Config State
  const [apiKey, setApiKey] = useState('');
  const [mockMode, setMockMode] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Lookup Form State
  const [lookupIp, setLookupIp] = useState('');
  const [selectedZone, setSelectedZone] = useState('Zone 1');
  const [isChecking, setIsChecking] = useState(false);

  // Data Consumption Logs State
  const [monthlyUsageKB, setMonthlyUsageKB] = useState(142.8);
  const [androidWeeklyMB, setAndroidWeeklyMB] = useState(4.12);
  const [webWeeklyMB, setWebWeeklyMB] = useState(8.94);
  const [androidPct, setAndroidPct] = useState(32);
  const [webPct, setWebPct] = useState(68);
  const [recentLookups, setRecentLookups] = useState([]);

  useEffect(() => {
    fetchConsumption();
  }, []);

  const fetchConsumption = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/telemetry/consumption`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        setMonthlyUsageKB(data.monthly_usage_kb);
        setAndroidWeeklyMB(data.android_weekly_mb);
        setWebWeeklyMB(data.web_weekly_mb);
        setAndroidPct(data.android_pct);
        setWebPct(data.web_pct);
        if (data.recent_lookups && data.recent_lookups.length > 0) {
          setRecentLookups(data.recent_lookups.map(log => ({
            id: log.id.toString(),
            ip: log.ip || 'N/A',
            score: log.score || 0,
            status: log.status || 'Clean',
            zone: log.zone || 'Zone 1 (Venue Node)',
            platform: log.platform || 'Android App',
            bytesSent: log.bytes_sent || 0,
            bytesRecv: log.bytes_recv || 0,
            timestamp: new Date(log.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })));
        }
      }
    } catch (e) {
      console.log('Telemetry fetch error:', e);
    }
  };

  const handleUpdateConfig = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/intel/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Platform': 'Android App' },
        body: JSON.stringify({ api_key: apiKey, mock_mode: mockMode }),
      });
      if (res.ok) {
        RNAlert.alert('Success', 'Threat Intel configuration updated on Flask server.');
      }
    } catch (e) {
      RNAlert.alert('Error', 'Could not connect to Flask API backend.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLookup = async () => {
    if (!lookupIp.trim()) return;
    setIsChecking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/intel/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Platform': 'Android App',
        },
        body: JSON.stringify({
          ip: lookupIp.trim(),
          zone: `${selectedZone} (Venue Node)`,
          platform: 'Android App',
        }),
      });

      if (res.ok) {
        setLookupIp('');
        await fetchConsumption();
      } else {
        RNAlert.alert('Lookup Failed', 'API backend returned an error.');
      }
    } catch (e) {
      RNAlert.alert('Connection Error', `Failed to reach Flask server at ${API_BASE_URL}`);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Clean') return colors.low;
    if (status === 'Suspicious') return colors.high;
    return colors.crit;
  };

  const getStatusBg = (status) => {
    if (status === 'Clean') return colors.lowBg;
    if (status === 'Suspicious') return colors.highBg;
    return colors.critBg;
  };


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Title & Platform Connection Status */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Threat Intelligence</Text>
          <Text style={styles.screenSubtitle}>
            SNSOC Venue Management & Android Data Consumption
          </Text>
        </View>
        <Badge
          label={mockMode ? 'Mock Mode' : 'Live Intel'}
          color={mockMode ? colors.high : colors.low}
          bg={mockMode ? colors.highBg : colors.lowBg}
        />
      </View>

      {/* CARD 1: Threat Intelligence API Configuration */}
      <Card>
        <Text style={styles.cardSubtitle}>THREAT INTELLIGENCE API CONFIGURATION</Text>
        <Text style={styles.cardDesc}>
          Provide an AbuseIPDB Key to enable live external threat feeds across venue networks.
        </Text>

        <Text style={styles.inputLabel}>API Key</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter AbuseIPDB Key"
          placeholderTextColor={colors.textMuted}
          value={apiKey}
          onChangeText={setApiKey}
          secureTextEntry
        />

        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>Force Mock Mode (No external API calls)</Text>
          <Switch
            value={mockMode}
            onValueChange={setMockMode}
            trackColor={{ false: colors.borderColor, true: colors.accentBlue }}
            thumbColor={colors.textWhite}
          />
        </View>

        <TouchableOpacity
          style={styles.buttonPrimary}
          activeOpacity={0.8}
          onPress={handleUpdateConfig}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color={colors.textWhite} />
          ) : (
            <Text style={styles.buttonText}>Update Integration</Text>
          )}
        </TouchableOpacity>
      </Card>

      {/* CARD 2: Perform Explicit IP Lookup */}
      <Card>
        <Text style={styles.cardSubtitle}>PERFORM EXPLICIT IP LOOKUP</Text>
        <Text style={styles.cardDesc}>
          Query reputation for suspicious IP traffic observed in venue zones.
        </Text>

        <Text style={styles.inputLabel}>IP Address</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 185.15.1.100"
          placeholderTextColor={colors.textMuted}
          value={lookupIp}
          onChangeText={setLookupIp}
          autoCapitalize="none"
        />

        {/* Venue Zone Selector Dropdown */}
        <Text style={styles.inputLabel}>Select Venue Zone</Text>
        <View style={styles.zoneRow}>
          {['Zone 1', 'Zone 2', 'Zone 3'].map(zone => (
            <TouchableOpacity
              key={zone}
              style={[styles.zoneChip, selectedZone === zone && styles.zoneChipActive]}
              onPress={() => setSelectedZone(zone)}
            >
              <Text
                style={[
                  styles.zoneChipText,
                  selectedZone === zone && styles.zoneChipTextActive,
                ]}
              >
                {zone}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.buttonPrimary, { marginTop: 16 }]}
          activeOpacity={0.8}
          onPress={handleLookup}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator color={colors.textWhite} />
          ) : (
            <Text style={styles.buttonText}>Check Reputation</Text>
          )}
        </TouchableOpacity>
      </Card>

      {/* CARD 3: API Data Consumption */}
      <Card>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardSubtitle}>API DATA CONSUMPTION</Text>
          <Badge label={`${monthlyUsageKB} KB used this month`} color={colors.accentBlue} bg="rgba(31, 111, 235, 0.15)" />
        </View>
        <Text style={styles.cardDesc}>
          Comparing payload bandwidth consumed between Android Mobile App and Web Venue Management Client.
        </Text>

        {/* Comparison Bar: Android vs Web Data Consumed */}
        <View style={styles.chartBlock}>
          <View style={styles.chartLabelRow}>
            <Text style={styles.chartTitle}>Weekly Android App API Usage vs Web Dashboard</Text>
            <Text style={styles.chartSub}>Android: {androidPct}% | Web: {webPct}%</Text>
          </View>

          {/* Bar Chart View */}
          <View style={styles.barContainer}>
            <View style={[styles.barFillAndroid, { width: `${androidPct}%` }]} />
            <View style={[styles.barFillWeb, { width: `${webPct}%` }]} />
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accentBlue }]} />
              <Text style={styles.legendText}>🤖 Android App ({androidWeeklyMB} MB)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
              <Text style={styles.legendText}>🖥 Web Dashboard ({webWeeklyMB} MB)</Text>
            </View>
          </View>
        </View>

        {/* Detailed Lookup Consumption Logs */}
        <Text style={[styles.cardSubtitle, { marginTop: 20 }]}>RECENT LOOKUP BANDWIDTH LOGS</Text>
        {recentLookups.map(item => (
          <View key={item.id} style={styles.logRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.logHeader}>
                <Text style={styles.logIp}>{item.ip}</Text>
                <Badge
                  label={`${item.score}/100 - ${item.status}`}
                  color={getStatusColor(item.status)}
                  bg={getStatusBg(item.status)}
                />
              </View>
              <Text style={styles.logMeta}>
                📍 {item.zone} • {item.timestamp}
              </Text>
              <View style={styles.logMetrics}>
                <Badge
                  label={item.platform}
                  color={item.platform === 'Android App' ? colors.accentBlue : '#8b5cf6'}
                  bg={item.platform === 'Android App' ? 'rgba(31, 111, 235, 0.1)' : 'rgba(139, 92, 246, 0.1)'}
                />
                <Text style={styles.bytesText}>
                  ⬆ {item.bytesSent} B  |  ⬇ {item.bytesRecv} B (Total: {item.bytesSent + item.bytesRecv} B)
                </Text>
              </View>
            </View>
          </View>
        ))}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 44,
  },
  toggleText: {
    fontSize: 14,
    color: colors.textMain,
    flex: 1,
    paddingRight: 12,
  },
  buttonPrimary: {
    backgroundColor: colors.accentBlue,
    minHeight: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonText: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '600',
  },
  zoneRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  zoneChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderColor,
    backgroundColor: colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneChipActive: {
    backgroundColor: colors.accentBlue,
    borderColor: colors.accentBlue,
  },
  zoneChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  zoneChipTextActive: {
    color: colors.textWhite,
  },
  chartBlock: {
    backgroundColor: colors.bgDark,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderColor,
    marginTop: 8,
  },
  chartLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textWhite,
  },
  chartSub: {
    fontSize: 12,
    color: colors.textMuted,
  },
  barContainer: {
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 7,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  barFillAndroid: {
    height: '100%',
    backgroundColor: colors.accentBlue,
  },
  barFillWeb: {
    height: '100%',
    backgroundColor: '#8b5cf6',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  logRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logIp: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accentBlue,
  },
  logMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  logMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  bytesText: {
    fontSize: 11,
    color: colors.textMuted,
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
