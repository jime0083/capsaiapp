// このファイルは Cursor により生成された
// ルート: Stack + BottomTabs 構成

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './navigation/BottomTabs';
import AuthLoading from './screens/AuthLoading';
import LoginScreen from './screens/LoginScreen';
import OnboardGoalBudget from './screens/OnboardGoalBudget';
import SubscriptionChoice from './screens/SubscriptionChoice';
import SetPairPassword from './screens/SetPairPassword';
import SubscriptionScreen from './screens/SubscriptionScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AuthLoading" component={AuthLoading} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OnboardGoalBudget" component={OnboardGoalBudget} />
        <Stack.Screen name="SubscriptionChoice" component={SubscriptionChoice} />
        <Stack.Screen name="SetPairPassword" component={SetPairPassword} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen name="Home" component={BottomTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;


