import React, { Component } from "react";
import { Platform, StyleSheet, FlatList, Text, View, Button } from "react-native";

import { ListItem } from "react-native-elements";

import Spinner from "react-native-loading-spinner-overlay";

export default class HomePage extends Component {
	constructor(props) {
		super(props);
		this.state = { 
			spinner: false,
			data: [],
			page: 0,
			error: false,
			refreshing: false
    	};
  	}
  
  	componentDidMount() {
		this.getSaleGames();
	}

	getSaleGames(){
		return new Promise((resolve, reject) => {
			const { page } = this.state;
			const limit = 25;
			const skip = limit * page;
			global.gamesDB.find({ isOnSale: true }).skip(0).limit(0).exec( (err, docs) => {
				if(err){
					console.log("error finding games -> ", err);
					reject(err);
				} else {
					console.log("Got games! -> ", docs);
					this.setState({
						spinner: false,
						data: page === 0 ? docs : [...this.state.data, ...docs],
						refreshing: false,
						page: (page + 1)
					});
					resolve(docs);
				}
			});
		});
	}

	keyExtractor = (item, index) => `list-item-${index}`

	renderItem = ({ item }) => (
		<ListItem
		  title={item.title}
		  leftAvatar={{ source: { uri: "https://" + item.image } }}
		  subtitleStyle={styles.listSub}
		  badge={{ value: ("-" + item.salePercentage + "%"), status: "success" }}
		/>
	)

	render() {
		return (
			<FlatList
			  keyExtractor={this.keyExtractor}
			  data={this.state.data}
			  renderItem={this.renderItem}
			/>
		  )
	  }
}

const styles = StyleSheet.create({
  spinnerTextStyle: {
    color: "#FFF"
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  },
  listSub: {
  }
});
