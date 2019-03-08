/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */
if(__DEV__) {
	import('./reactronconfig').then(() => console.log('Reactotron Configured'))
}

import React, { Component } from "react";
import { Platform, StyleSheet, Text, View, Button } from "react-native";

import { createBottomTabNavigator, createStackNavigator, createAppContainer } from 'react-navigation';

import HomePage from "./src/pages/home";
import ConfigsPage from "./src/pages/configs";

import Spinner from "react-native-loading-spinner-overlay";

import Ionicons from 'react-native-vector-icons/Ionicons';
import FeatherIcons from 'react-native-vector-icons/Feather';

var Datastore = require('react-native-local-mongodb');
global.gamesDB = new Datastore({ filename: 'games', autoload: true });
global.gamePricesDB = new Datastore({ filename: 'gamePrices', autoload: true });

const TabNavigator = createBottomTabNavigator(
	{
		"Promoções": HomePage,
		"Configurações": ConfigsPage
	},
	{
		defaultNavigationOptions: ({ navigation }) => ({
		  	tabBarIcon: ({ focused, horizontal, tintColor }) => {
				const { routeName } = navigation.state;
				let IconComponent = FeatherIcons;
				let iconName;
				if (routeName === 'Promoções') {
			  		iconName = `percent`;
					// Sometimes we want to add badges to some icons. 
					// You can check the implementation below.
					// IconComponent = HomeIconWithBadge; 
				} else {
					iconName = `settings`;
				}
	
				// You can return any component that you like here!
				return <IconComponent name={iconName} size={25} color={tintColor} />;
		  	},
		}),
		tabBarOptions: {
		  	activeTintColor: 'blue',
		  	inactiveTintColor: 'gray',
		},
	  }
);

const AppContainer = createAppContainer(TabNavigator);

export default class App extends Component {
	render() {
	  return <AppContainer />;
	}
}