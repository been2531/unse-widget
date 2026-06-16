import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';

// Must run unconditionally at module load — this same JS bundle is loaded
// both for a normal app launch and for a headless widget-update task, and
// only the latter actually invokes this handler.
registerWidgetTaskHandler(widgetTaskHandler);

// Defers to expo-router's own entry for normal app boot.
import 'expo-router/entry';
