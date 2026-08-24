import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Settings, ShieldAlert, Compass, Play, Square, RefreshCcw } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useLocation } from '../hooks/useLocation';
import { colors } from '../theme/colors';

export default function LocationTestScreen() {
  const navigation = useNavigation();
  const {
    location,
    error,
    isLocating,
    isTracking,
    permissionStatus,
    isEmulator,
    accuracyWarning,
    requestLocationPermission,
    openLocationSettings,
    getLocationOnce,
    startTracking,
    stopTracking,
  } = useLocation();

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const formattedTime = location?.timestamp
    ? new Date(location.timestamp).toLocaleTimeString()
    : 'Never';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent={false} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify GPS Location</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Connection/Device Status Cards */}
        <View style={styles.statusSection}>
          <View style={[styles.statusCard, isEmulator && styles.emulatorCard]}>
            <Compass color={isEmulator ? '#D97706' : colors.primary} size={24} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusLabel}>Environment Type</Text>
              <Text style={[styles.statusValue, isEmulator && { color: '#D97706' }]}>
                {isEmulator ? 'Android Emulator / Simulator (Mocked)' : 'Physical Android/iOS Device (Hardware GPS)'}
              </Text>
            </View>
          </View>

          {/* Permissions Card */}
          <View style={styles.statusCard}>
            <ShieldAlert color="#3B82F6" size={24} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusLabel}>Location Permissions</Text>
              <Text style={[styles.statusValue, { textTransform: 'capitalize' }]}>
                {permissionStatus}
              </Text>
            </View>
            <TouchableOpacity style={styles.permissionActionBtn} onPress={() => requestLocationPermission()}>
              <Text style={styles.permissionActionBtnText}>Request</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Coordinate Display Card */}
        <View style={styles.coordinatesCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <MapPin color={colors.primary} size={20} />
              <Text style={styles.cardTitle}>Live GPS Coordinates</Text>
            </View>
            {isTracking && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE WATCH</Text>
              </View>
            )}
          </View>

          {location ? (
            <View style={styles.coordsGrid}>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Latitude</Text>
                <Text style={styles.coordValue}>{location.latitude.toFixed(7)}°</Text>
              </View>

              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Longitude</Text>
                <Text style={styles.coordValue}>{location.longitude.toFixed(7)}°</Text>
              </View>

              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Accuracy Radius</Text>
                <Text style={[
                  styles.coordValue,
                  accuracyWarning ? styles.warningText : styles.successText
                ]}>
                  {location.accuracy.toFixed(1)} meters
                </Text>
              </View>

              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Last Updated</Text>
                <Text style={styles.coordValue}>{formattedTime}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCoords}>
              <Text style={styles.emptyCoordsText}>No location captured yet.</Text>
              <Text style={styles.emptyCoordsSubText}>Trigger a one-time fetch or enable live tracking below.</Text>
            </View>
          )}

          {/* Accuracy Warning alert if accuracy > 50 meters */}
          {accuracyWarning && !isEmulator && (
            <View style={styles.warningAlert}>
              <ShieldAlert color="#EF4444" size={18} />
              <Text style={styles.warningAlertText}>
                Poor accuracy (&gt; 50 meters). We are trying to obtain a stronger satellite fix.
              </Text>
            </View>
          )}

          {/* Simulator note */}
          {isEmulator && (
            <View style={styles.infoAlert}>
              <Compass color="#D97706" size={18} />
              <Text style={styles.infoAlertText}>
                Simulators report mock locations. Verify on a physical device for accurate GPS readings.
              </Text>
            </View>
          )}
        </View>

        {/* Geolocation Errors */}
        {error && (
          <View style={styles.errorAlert}>
            <ShieldAlert color="#EF4444" size={20} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.errorTitle}>Location Error</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        )}

        {/* Buttons / Controls */}
        <View style={styles.controlsSection}>
          <TouchableOpacity 
            style={[styles.btn, styles.primaryBtn]} 
            onPress={() => getLocationOnce()}
            disabled={isLocating}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <RefreshCcw color="#FFF" size={18} style={styles.btnIcon} />
                <Text style={styles.btnText}>Fetch Location Once</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btn, isTracking ? styles.stopBtn : styles.startBtn]} 
            onPress={handleToggleTracking}
          >
            {isTracking ? (
              <>
                <Square color="#FFF" size={18} style={styles.btnIcon} />
                <Text style={styles.btnText}>Stop Live Tracking</Text>
              </>
            ) : (
              <>
                <Play color="#FFF" size={18} style={styles.btnIcon} />
                <Text style={styles.btnText}>Start Live Tracking</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btn, styles.secondaryBtn]} 
            onPress={openLocationSettings}
          >
            <Settings color="#334155" size={18} style={styles.btnIcon} />
            <Text style={styles.secondaryBtnText}>Open Location Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFCFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusSection: {
    marginBottom: 20,
    gap: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  emulatorCard: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFBEB',
  },
  statusTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  statusLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  permissionActionBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  permissionActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  coordinatesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  liveBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  coordsGrid: {
    gap: 14,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  coordValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  successText: {
    color: '#15803D',
  },
  warningText: {
    color: '#EF4444',
  },
  emptyCoords: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyCoordsText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  emptyCoordsSubText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  warningAlert: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  warningAlertText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
  },
  infoAlert: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderColor: '#FED7AA',
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  infoAlertText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
    flex: 1,
  },
  errorAlert: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    borderWidth: 1,
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 2,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  controlsSection: {
    gap: 12,
  },
  btn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  btnIcon: {
    marginRight: 8,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
  },
  startBtn: {
    backgroundColor: '#2563EB',
  },
  stopBtn: {
    backgroundColor: '#EF4444',
  },
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
});
