const { withAndroidManifest, withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// FortuneWidget here must match the `widgets[].name` in app.json's
// react-native-android-widget plugin config — that's what determines the
// generated provider class's package+name (`<package>.widget.FortuneWidget`).
const WIDGET_PROVIDER_SUBPACKAGE = 'widget';
const WIDGET_PROVIDER_CLASS = 'FortuneWidget';

const receiverKotlin = (packageName) => `package ${packageName}

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent

import ${packageName}.${WIDGET_PROVIDER_SUBPACKAGE}.${WIDGET_PROVIDER_CLASS}

// Fires on BOOT_COMPLETED (AlarmManager drops pending alarms across a
// reboot, so this just re-arms the chain) or on the alarm MidnightAlarmScheduler
// scheduled. Either way it queues the next occurrence; only the alarm path
// also forces an immediate widget redraw, so the widget doesn't wait out
// the library's own 30-minute updatePeriodMillis tick after midnight.
class MidnightAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED) {
      requestWidgetRedraw(context)
    }
    MidnightAlarmScheduler.scheduleNext(context)
  }

  private fun requestWidgetRedraw(context: Context) {
    val appWidgetManager = AppWidgetManager.getInstance(context)
    val component = ComponentName(context, ${WIDGET_PROVIDER_CLASS}::class.java)
    val ids = appWidgetManager.getAppWidgetIds(component)
    if (ids.isEmpty()) return

    context.sendBroadcast(
      Intent(context, ${WIDGET_PROVIDER_CLASS}::class.java).apply {
        action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
      }
    )
  }
}
`;

const schedulerKotlin = (packageName) => `package ${packageName}

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import java.util.Calendar

// Deliberately setAndAllowWhileIdle, not setExactAndAllowWhileIdle — the
// exact variant requires the user to flip on SCHEDULE_EXACT_ALARM special
// app access in system settings on API 31+, which is unnecessary friction
// for a "today's fortune" widget. This fires close to midnight (typically
// within a few minutes, more under Doze) with no extra permission prompt.
object MidnightAlarmScheduler {
  private const val REQUEST_CODE = 4821

  fun scheduleNext(context: Context) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pendingIntent = PendingIntent.getBroadcast(
      context,
      REQUEST_CODE,
      Intent(context, MidnightAlarmReceiver::class.java),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val nextMidnight = Calendar.getInstance().apply {
      add(Calendar.DAY_OF_YEAR, 1)
      set(Calendar.HOUR_OF_DAY, 0)
      set(Calendar.MINUTE, 0)
      set(Calendar.SECOND, 5)
      set(Calendar.MILLISECOND, 0)
    }

    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextMidnight.timeInMillis, pendingIntent)
  }
}
`;

function withMidnightAlarmManifest(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = manifest.manifest.application[0];

    manifest.manifest['uses-permission'] = manifest.manifest['uses-permission'] || [];
    const hasBootPermission = manifest.manifest['uses-permission'].some(
      (entry) => entry.$['android:name'] === 'android.permission.RECEIVE_BOOT_COMPLETED'
    );
    if (!hasBootPermission) {
      manifest.manifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.RECEIVE_BOOT_COMPLETED' },
      });
    }

    app.receiver = app.receiver || [];
    const alreadyRegistered = app.receiver.some(
      (entry) => entry.$['android:name'] === '.MidnightAlarmReceiver'
    );
    if (!alreadyRegistered) {
      app.receiver.push({
        $: { 'android:name': '.MidnightAlarmReceiver', 'android:exported': 'false' },
        'intent-filter': [
          { action: [{ $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } }] },
        ],
      });
    }

    return config;
  });
}

function withMidnightAlarmKotlinFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName = config.android.package;
      const javaDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/java',
        ...packageName.split('.')
      );
      fs.mkdirSync(javaDir, { recursive: true });
      fs.writeFileSync(path.join(javaDir, 'MidnightAlarmReceiver.kt'), receiverKotlin(packageName));
      fs.writeFileSync(path.join(javaDir, 'MidnightAlarmScheduler.kt'), schedulerKotlin(packageName));
      return config;
    },
  ]);
}

function withMidnightAlarmScheduleOnLaunch(config) {
  return withMainApplication(config, (config) => {
    const contents = config.modResults.contents;
    if (!contents.includes('MidnightAlarmScheduler.scheduleNext')) {
      config.modResults.contents = contents.replace(
        /override fun onCreate\(\) \{\n/,
        `override fun onCreate() {\n    MidnightAlarmScheduler.scheduleNext(this)\n`
      );
    }
    return config;
  });
}

// Adds the AlarmManager-driven near-midnight widget refresh: registers a
// receiver + BOOT_COMPLETED permission in the manifest, drops in the two
// Kotlin source files, and wires the initial schedule call into
// MainApplication.onCreate() (which runs on every process start, including
// the headless one used for widget-only updates — see MidnightAlarmScheduler
// for why this re-arms safely on every call).
function withMidnightAlarmReceiver(config) {
  config = withMidnightAlarmManifest(config);
  config = withMidnightAlarmKotlinFiles(config);
  config = withMidnightAlarmScheduleOnLaunch(config);
  return config;
}

module.exports = withMidnightAlarmReceiver;
