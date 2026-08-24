import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

const { DeviceNumberModule } = NativeModules;

/**
 * Checks whether the given mobile number matches a SIM card phone number available on this physical device.
 * Returns true only if permission is granted and a matching SIM number is found on the device.
 */
export async function checkIsNumberOnDevice(mobileNumber: string): Promise<boolean> {
  if (!mobileNumber) return false;

  const cleanInput = mobileNumber.replace(/[^0-9]/g, '');
  if (cleanInput.length < 10) return false;

  try {
    if (Platform.OS === 'android') {
      // Request phone number permissions if required
      if (Platform.Version >= 26 && PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS, {
          title: 'Phone State Permission',
          message: 'Dharani Herbbals requires access to verify if your phone number is available on this device.',
          buttonPositive: 'OK',
        });
      }

      if (PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE, {
          title: 'Phone State Permission',
          message: 'Dharani Herbbals requires access to verify if your phone number is available on this device.',
          buttonPositive: 'OK',
        });
      }

      if (DeviceNumberModule && typeof DeviceNumberModule.isPhoneNumberOnDevice === 'function') {
        const isMatched: boolean = await DeviceNumberModule.isPhoneNumberOnDevice(cleanInput);
        return Boolean(isMatched);
      }
    }
  } catch (error) {
    console.warn('Error checking if phone number is on device:', error);
  }

  return false;
}
