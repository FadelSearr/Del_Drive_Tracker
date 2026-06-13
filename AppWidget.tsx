import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function DriveTrackerWidget() {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#09090F',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TextWidget
        text="Del Road Tracker"
        style={{
          fontSize: 16,
          color: '#4B7EFF',
          fontFamily: 'Inter',
          fontWeight: 'bold',
        }}
      />
      <TextWidget
        text="Standby"
        style={{
          fontSize: 24,
          color: '#FFFFFF',
          fontFamily: 'Inter',
          fontWeight: 'bold',
          marginTop: 8,
        }}
      />
    </FlexWidget>
  );
}
