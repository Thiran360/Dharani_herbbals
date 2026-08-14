package com.dharaniherbbals

import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AdminNotificationSoundModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  private val handler = Handler(Looper.getMainLooper())
  private var mediaPlayer: MediaPlayer? = null

  override fun getName(): String = "AdminNotificationSound"

  @ReactMethod
  fun playNewOrderSound() {
    try {
      stopCurrentSound()

      val notificationUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)

      mediaPlayer = MediaPlayer().apply {
        setDataSource(reactContext, notificationUri)
        setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        )
        isLooping = true
        prepare()
        start()
      }

      handler.postDelayed({ stopCurrentSound() }, ALERT_DURATION_MS)
    } catch (_: Exception) {
      stopCurrentSound()
      // Sound failures should never interrupt the admin dashboard.
    }
  }

  private fun stopCurrentSound() {
    handler.removeCallbacksAndMessages(null)
    mediaPlayer?.let {
      if (it.isPlaying) {
        it.stop()
      }
      it.release()
    }
    mediaPlayer = null
  }

  companion object {
    private const val ALERT_DURATION_MS = 5000L
  }
}
