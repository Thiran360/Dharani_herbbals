import { useState, useEffect, useCallback, useRef } from 'react';
import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export type PermissionState = 'granted' | 'denied' | 'disabled' | 'undetermined';

const isEmulatorCoords = (lat: number, lon: number): boolean => {
  return (
    (Math.abs(lat - 37.4219983) < 0.001 && Math.abs(lon - (-122.084)) < 0.001) ||
    (Math.abs(lat - 37.332331) < 0.001 && Math.abs(lon - (-122.031219)) < 0.001)
  );
};

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('undetermined');
  const [isEmulator, setIsEmulator] = useState<boolean>(false);
  const [accuracyWarning, setAccuracyWarning] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);

  // Check current permission status
  const checkLocationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return permissionStatus === 'granted';
    }

    if (Platform.OS === 'android') {
      try {
        const hasFine = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        const hasCoarse = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );
        const isGranted = hasFine || hasCoarse;
        setPermissionStatus(isGranted ? 'granted' : 'denied');
        return isGranted;
      } catch (e) {
        return false;
      }
    }
    return false;
  }, [permissionStatus]);

  // Request permissions explicitly
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        const status = await Geolocation.requestAuthorization('whenInUse');
        const isGranted = status === 'granted';
        setPermissionStatus(isGranted ? 'granted' : 'denied');
        return isGranted;
      }

      if (Platform.OS === 'android') {
        const hasFine = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        const hasCoarse = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
        if (hasFine || hasCoarse) {
          setPermissionStatus('granted');
          return true;
        }

        const grantedMap = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        const fineResult = grantedMap[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
        const coarseResult = grantedMap[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION];

        const isGranted = fineResult === PermissionsAndroid.RESULTS.GRANTED || coarseResult === PermissionsAndroid.RESULTS.GRANTED;
        setPermissionStatus(isGranted ? 'granted' : 'denied');
        return isGranted;
      }
    } catch (err) {
      console.warn('Error requesting location permission:', err);
    }
    return false;
  }, []);

  // Open settings directly
  const openLocationSettings = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(async () => {
          await Linking.openSettings();
        });
      } else {
        await Linking.openSettings();
      }
    } catch (err) {
      console.warn('Error opening settings:', err);
      Alert.alert(
        'Settings Error',
        'Could not open settings. Please enable location manually in your device settings.'
      );
    }
  }, []);

  const printLocationDiagnostics = (position: any, source: string) => {
    if (!position || !position.coords) return;

    const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
    const timestamp = position.timestamp || Date.now();
    const now = Date.now();
    const timeDiffMs = now - timestamp;
    const timeDiffSec = (timeDiffMs / 1000).toFixed(2);
    const isStale = timeDiffMs > 5000;
    const fixType = accuracy <= 20 ? 'Hardware GPS Satellite (High Precision)' : (accuracy <= 100 ? 'Cell Tower / Wi-Fi Network (Moderate)' : 'IP / Cell Tower Triangulation (Low Accuracy >100m)');

    console.log('================ GPS LOCATION DIAGNOSTICS ================');
    console.log(`[SOURCE]: ${source}`);
    console.log(`[RAW POSITION OBJECT]:`, JSON.stringify(position, null, 2));
    console.log(`[LATITUDE]: ${latitude}`);
    console.log(`[LONGITUDE]: ${longitude}`);
    console.log(`[ACCURACY]: ${accuracy} meters (${fixType})`);
    console.log(`[ALTITUDE]: ${altitude !== undefined && altitude !== null ? altitude + 'm' : 'N/A'}`);
    console.log(`[HEADING]: ${heading || 'N/A'}, [SPEED]: ${speed || 'N/A'}`);
    console.log(`[TIMESTAMP]: ${timestamp} (Fix age: ${timeDiffSec}s ago)`);
    console.log(`[STALE FIX]: ${isStale ? 'YES (Age > 5s)' : 'NO (Fresh Fix)'}`);
    console.log('==========================================================');
  };

  // Fetch current position once with high accuracy and error handling
  const getLocationOnce = useCallback(async (): Promise<LocationData | null> => {
    setIsLocating(true);
    setError(null);
    setAccuracyWarning(false);

    try {
      if (Platform.OS === 'android') {
        const hasFine = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        const hasCoarse = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
        if (!hasFine && !hasCoarse) {
          setIsLocating(false);
          setError('Location permission denied.');
          return null;
        }
      }

      return await new Promise((resolve) => {
        // High Accuracy Fetch Attempt with Native Android LocationManager
        Geolocation.getCurrentPosition(
          (position) => {
            if (position && position.coords) {
              printLocationDiagnostics(position, 'getCurrentPosition (enableHighAccuracy: true)');
              const { latitude, longitude, accuracy } = position.coords;
              const locData = { latitude, longitude, accuracy: accuracy || 0, timestamp: position.timestamp || Date.now() };
              setLocation(locData);
              setIsLocating(false);
              resolve(locData);
            } else {
              setIsLocating(false);
              resolve(null);
            }
          },
          (err1) => {
            console.warn('High accuracy location attempt notice, trying network fallback:', err1);
            // Fallback Attempt if indoor/satellite lock delays
            Geolocation.getCurrentPosition(
              (position2) => {
                if (position2 && position2.coords) {
                  printLocationDiagnostics(position2, 'getCurrentPosition (enableHighAccuracy: false Network Fallback)');
                  const { latitude, longitude, accuracy } = position2.coords;
                  const locData = { latitude, longitude, accuracy: accuracy || 0, timestamp: position2.timestamp || Date.now() };
                  setLocation(locData);
                  setIsLocating(false);
                  resolve(locData);
                } else {
                  setIsLocating(false);
                  resolve(null);
                }
              },
              (err2) => {
                let msg = 'Failed to retrieve location.';
                if (err2.code === 1) msg = 'Location permission denied.';
                else if (err2.code === 2) msg = 'GPS is turned off. Please turn on device location.';
                else if (err2.code === 3) msg = 'Location request timed out.';
                
                setError(msg);
                setIsLocating(false);
                resolve(null);
              },
              { enableHighAccuracy: false, timeout: 10000, maximumAge: 0, forceLocationManager: true }
            );
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0,
            forceLocationManager: true,
          }
        );
      });
    } catch (err) {
      console.warn('Location exception:', err);
      setIsLocating(false);
      return null;
    }
  }, []);

  // Start continuous watchPosition live tracking
  const startTracking = useCallback(async () => {
    if (watchIdRef.current !== null) return;

    setError(null);
    setAccuracyWarning(false);

    // Dynamic permission check before starting watch
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        setError('Location permission denied.');
        return;
      }
    }

    setIsTracking(true);

    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = position.timestamp;

        console.log(`Live GPS Update. Accuracy: ${accuracy}m`);

        const genericMock = isEmulatorCoords(latitude, longitude);
        setIsEmulator(genericMock);

        if (accuracy > 50 && !genericMock) {
          setAccuracyWarning(true);
        } else {
          setAccuracyWarning(false);
        }

        setLocation({ latitude, longitude, accuracy, timestamp });
      },
      (err) => {
        console.warn('Geolocation.watchPosition error:', err);
        if (err.code === 1) {
          setError('Permission denied.');
          setPermissionStatus('denied');
        } else if (err.code === 2) {
          setError('Location services disabled.');
          setPermissionStatus('disabled');
        } else if (err.code === 3) {
          setError('Live tracking timed out.');
        } else {
          setError(err.message);
        }
        stopTracking();
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 5,
        interval: 3000,
        fastestInterval: 2000,
      }
    );
  }, [checkLocationPermission, requestLocationPermission]);

  // Stop continuous watchPosition live tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    location,
    error,
    isLocating,
    isTracking,
    permissionStatus,
    isEmulator,
    accuracyWarning,
    checkLocationPermission,
    requestLocationPermission,
    openLocationSettings,
    getLocationOnce,
    startTracking,
    stopTracking,
  };
};
