// このファイルは Cursor により生成された
// React Navigation Bottom Tabs

import React from 'react';
import { Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import InputScreen from '../screens/InputScreen';
import InsightScreen from '../screens/InsightScreen';
import GoalsScreen from '../screens/GoalsScreen';
import MyPageScreen from '../screens/MyPageScreen';

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#0076FF', tabBarInactiveTintColor: '#8C8C8C' }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{
        tabBarIcon: ({ size, color }) => (
          <Image source={require('../icons/hime.png')} style={{ width: size, height: size, tintColor: color }} />
        )
      }} />
      <Tab.Screen name="Input" component={InputScreen} options={{
        tabBarIcon: ({ size, color }) => (
          <Image source={require('../icons/data2.png')} style={{ width: size, height: size, tintColor: color }} />
        )
      }} />
      <Tab.Screen name="Insight" component={InsightScreen} options={{
        tabBarIcon: ({ size, color }) => (
          <Image source={require('../icons/search.png')} style={{ width: size, height: size, tintColor: color }} />
        )
      }} />
      <Tab.Screen name="Goals" component={GoalsScreen} options={{
        tabBarIcon: ({ size, color }) => (
          <Image source={require('../icons/goal2.png')} style={{ width: size, height: size, tintColor: color }} />
        )
      }} />
      <Tab.Screen name="MyPage" component={MyPageScreen} options={{
        tabBarIcon: ({ size, color }) => (
          <Image source={require('../icons/bel2.png')} style={{ width: size, height: size, tintColor: color }} />
        )
      }} />
    </Tab.Navigator>
  );
};

export default BottomTabs;


