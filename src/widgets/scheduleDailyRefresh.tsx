import { FlexWidget, TextWidget, requestWidgetUpdate } from 'react-native-android-widget';

import { renderCurrentWidgetState } from './widgetTaskHandler';

const WIDGET_NAME = 'FortuneWidget';

// requestWidgetUpdate's renderWidget callback must always return a
// WidgetRepresentation, but renderCurrentWidgetState() returns null before
// onboarding completes — this fallback keeps the type honest without
// special-casing every call site.
function renderPendingOnboardingPlaceholder() {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
      }}
    >
      <TextWidget text="앱을 열어 시작해주세요" style={{ fontSize: 13, color: '#888888' }} />
    </FlexWidget>
  );
}

// Opportunistic refresh — call this whenever the app comes to the
// foreground (e.g. a root-layout effect) or right after onboarding/a care
// action, so the widget catches up immediately instead of waiting for the
// next updatePeriodMillis tick.
//
// There's also a near-midnight AlarmManager trigger (see
// plugins/withMidnightAlarmReceiver.js) that forces a widget redraw without
// needing the app foregrounded — it's a separate native path that doesn't
// call into this JS function at all (the headless Kotlin receiver rebroadcasts
// ACTION_APPWIDGET_UPDATE directly), so this opportunistic call and the
// library's own updatePeriodMillis (30-minute minimum, set in app.json)
// remain as fallbacks for whenever that alarm is delayed (e.g. Doze) or not
// yet armed (first install, before MainApplication.onCreate() has run once).
export async function refreshFortuneWidget(): Promise<void> {
  await requestWidgetUpdate({
    widgetName: WIDGET_NAME,
    renderWidget: async () => (await renderCurrentWidgetState()) ?? renderPendingOnboardingPlaceholder(),
    widgetNotFound: () => {
      // No widget added to the home screen — nothing to refresh.
    },
  });
}
