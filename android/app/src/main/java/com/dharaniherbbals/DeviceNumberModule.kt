package com.dharaniherbbals

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DeviceNumberModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "DeviceNumberModule"

  private fun cleanNumber(number: String?): String {
    if (number.isNullOrBlank()) return ""
    val digits = number.replace(Regex("[^0-9]"), "")
    return if (digits.length >= 10) digits.takeLast(10) else digits
  }

  @ReactMethod
  fun isPhoneNumberOnDevice(targetNumber: String, promise: Promise) {
    try {
      val cleanTarget = cleanNumber(targetNumber)
      if (cleanTarget.length < 10) {
        promise.resolve(false)
        return
      }

      val hasPhoneNumbersPermission = ContextCompat.checkSelfPermission(
        reactContext,
        Manifest.permission.READ_PHONE_NUMBERS
      ) == PackageManager.PERMISSION_GRANTED

      val hasPhoneStatePermission = ContextCompat.checkSelfPermission(
        reactContext,
        Manifest.permission.READ_PHONE_STATE
      ) == PackageManager.PERMISSION_GRANTED

      if (!hasPhoneNumbersPermission && !hasPhoneStatePermission) {
        promise.resolve(false)
        return
      }

      val simNumbers = mutableListOf<String>()

      // 1. Try TelephonyManager line1Number
      try {
        val telephonyManager = reactContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
        val line1 = telephonyManager?.line1Number
        if (!line1.isNullOrBlank()) {
          simNumbers.add(cleanNumber(line1))
        }
      } catch (_: Exception) {}

      // 2. Try SubscriptionManager (Android 5.1 / API 22+)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
        try {
          val subscriptionManager = reactContext.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
          val subInfoList = subscriptionManager?.activeSubscriptionInfoList
          if (subInfoList != null) {
            for (info in subInfoList) {
              val number = info.number
              if (!number.isNullOrBlank()) {
                simNumbers.add(cleanNumber(number))
              }
            }
          }
        } catch (_: Exception) {}
      }

      val isMatched = simNumbers.any { it.isNotBlank() && it == cleanTarget }
      promise.resolve(isMatched)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }
}
