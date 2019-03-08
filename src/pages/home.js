import React, { Component } from "react";
import { Platform, StyleSheet, FlatList, Text, View, Button, ActivityIndicator, TouchableOpacity } from "react-native";

import { ListItem, SearchBar } from "react-native-elements";

import Spinner from "react-native-loading-spinner-overlay";

import _ from 'lodash';

import Icon from 'react-native-vector-icons/Feather';

export default class HomePage extends Component {
	constructor(props) {
		super(props);
		this.state = { 
			spinner: false,
			ogData: [],
			data: [],
			page: 0,
			error: false,
			refreshing: false,
			searchVal: ""
		};
		
		this.getSaleGames = this.getSaleGames.bind(this);
		this.updateGames = this.updateGames.bind(this);
	}
  
  componentDidMount() {
		this.getSaleGames();
	}

	searchFilterFunction(text){
		this.setState({
      searchVal: text
    });
		const { ogData } = this.state;
		const newData = ogData.filter(item => {
			console.log(item);
			const itemData = item.gameInf.title.toUpperCase();
			const textData = text.toUpperCase();

			return itemData.indexOf(textData) > -1;
		});    
		this.setState({ data: newData });
	}

	getSaleGames(){
		return new Promise((resolve, reject) => {
			this.setState({ refreshing: true });
			const { page } = this.state;
			const limit = 25;
			const skip = limit * page;
			global.gamePricesDB.find({ "priceInf.discount_price": { $exists: true } }).sort({ created_date: -1 }).exec((err, docs) => {
				if(err){
					console.log("error finding games -> ", err);
					reject(err);
				} else {
					docs = _.uniqBy(docs, 'game_id');
					docs = docs.map(async function (val) {
						try {
							let tmpGame = await global.gamesDB.findOneAsync({ _id: val.game_id });
							return { gameInf: tmpGame, priceInf: val.priceInf };
						} catch (error) {
							console.log("errro map -> ", error);
						}
					});
					Promise.all(docs).then(
							(finalDocs) => {
								finalDocs = _.filter(finalDocs, (val) => {
									return (val && val.gameInf && val.priceInf);
								});
								finalDocs = _.orderBy(finalDocs, "gameInf.topScore", "asc");
								console.log("fin docs ->", finalDocs);
								this.setState({
									spinner: false,
									data: finalDocs,
									ogData: finalDocs,
									refreshing: false,
									page: (page + 1)
								});
								resolve(finalDocs);
							},
							(err) => {
								console.log("final err -> ", err);
								this.setState({
									spinner: false,
									refreshing: false,
									error: true
								});
								reject(err);
							}
					);
				}
			});
		});
	}

	onRefresh(){
		this.setState({ refreshing: true });
		this.getSaleGames()
		.then(
				(res) => {
					this.setState({ refreshing: false });
				},
				(err) => {
					this.setState({ refreshing: false });
				}
		);
	}

	keyExtractor = (item, index) => `list-item-${index}`

	renderItem = ({ item }) => (
		<ListItem
		  title={item.gameInf?.title}
			subtitle={<View style={{flexDirection: 'row', justifyContent: "space-between", alignItems:'center' }}><Text style={{ textDecorationLine: 'line-through', backgroundColor: "#c51828", fontSize: 10, color: 'white',  }}>{item.priceInf?.regular_price?.amount}</Text><Text style={{ fontSize: 15, backgroundColor: "#18c52a", padding: 3, color: 'white' }}>{item.priceInf?.discount_price?.amount}</Text></View>}
		  leftAvatar={{ source: { uri: "https:" + item.gameInf?.image } }}
		  subtitleStyle={styles.listSub}
		  // badge={{ value: (), status: "success" }}
		/>
	)

	renderHeader = () => {
    return (
      <SearchBar        
					placeholder="Pesquisar"        
					round
					onChangeText={text => this.searchFilterFunction(text)}
					autoCorrect={false}
					value={this.state.searchVal}       
				/>
    );
	};
	
	renderSeparator = () => {
    return (
      <View
        style={{
          height: 1,
          width: '86%',
          backgroundColor: '#CED0CE',
          marginLeft: '14%',
        }}
      />
    );
	};
	
	updateGames(){
		this.getSaleGames();
	}

	render() {
		if(this.state.refreshing){
			return (
				<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
					<ActivityIndicator />
				</View>
			);
		} else if(this.state.ogData.length == 0){
			return (
				<View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
					<TouchableOpacity style={styles.button} onPress={this.updateGames} >
         		<Icon name="refresh-cw" size={30} color="#0610e6" />
       		</TouchableOpacity>
					<Text style={{ textAlign: "center", fontSize: 20 }}> Não existem jogos em promoção (atualiza a BD em Configurações) </Text>
				</View>
			);
		} else {
				return (
					<View>
						<FlatList
							keyExtractor={this.keyExtractor}
							data={this.state.data}
							renderItem={this.renderItem}
							onRefresh={() => this.onRefresh()}
							refreshing={this.state.refreshing}
							ListHeaderComponent={this.renderHeader}
							ListHeaderComponent={this.renderHeader}
						/>
					</View>
				)
		}
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
