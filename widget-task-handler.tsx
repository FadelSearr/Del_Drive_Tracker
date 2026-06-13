import React from 'react';
import { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { DriveTrackerWidget } from './AppWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const Widget = DriveTrackerWidget;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
      props.renderWidget(<Widget />);
      break;

    case 'WIDGET_UPDATE':
      props.renderWidget(<Widget />);
      break;

    case 'WIDGET_RESIZED':
      props.renderWidget(<Widget />);
      break;

    case 'WIDGET_DELETED':
      // Cleanup if needed
      break;

    case 'WIDGET_CLICK':
      // Handle widget clicks
      break;

    default:
      break;
  }
}
