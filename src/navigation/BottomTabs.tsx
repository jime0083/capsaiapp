// このファイルは Cursor により生成された
// React Navigation Bottom Tabs

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import InputScreen from '../screens/InputScreen';
import InsightScreen from '../screens/InsightScreen';
import GoalsScreen from '../screens/GoalsScreen';
import MyPageScreen from '../screens/MyPageScreen';

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Input" component={InputScreen} />
      <Tab.Screen name="Insight" component={InsightScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="MyPage" component={MyPageScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabs;


