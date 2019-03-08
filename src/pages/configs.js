import React, { Component } from "react";
import { Platform, StyleSheet, Text, View, Button } from "react-native";

import Spinner from "react-native-loading-spinner-overlay";

import _ from 'lodash';

export default class ConfigsPage extends Component {
	
	constructor(props) {
		super(props);
		this.state = { spinner: false };
		this.updateEverything = this.updateEverything.bind(this);
		this.updatePrices = this.updatePrices.bind(this);
		this.fetchPrices = this.fetchPrices.bind(this);
	}

	render() {
		return (
		<View style={styles.container}>
			<Spinner
				visible={this.state.spinner}
				textContent={"Loading..."}
				textStyle={styles.spinnerTextStyle}
			/>
			<Text style={styles.welcome}>Atualiza os jogos/preços com os botões abaixo</Text>
			<View style={{ margin: 10 }}>
				<Button
					onPress={this.updateEverything}
					title="Atualizar Jogos e Preços"
					color="#841584"
					accessibilityLabel="Download Games and Prices"
				/>
			</View>
			<View style={{ margin: 10 }}>
				<Button
					onPress={this.updatePrices}
					title="Atualizar Preços"
					color="#841584"
					accessibilityLabel="Download Prices List"
				/>
			</View>
			<View style={{ margin: 10 }}>
				{/* <Button
					onPress={this.queryGames}
					title="Query Games"
					color="#841584"
					accessibilityLabel="Query Games List"
				/> */}
			</View>
		</View>
		);
	}

	fetchSaleGames(){
		return new Promise((resolve, reject) => {
			fetch("https://searching.nintendo-europe.com/pt/select?q=*&fq=type%3AGAME%20AND%20((playable_on_txt%3A%22HAC%22)%20AND%20(dates_released_dts%3A%5B*%20TO%20NOW%5D%20AND%20nsuid_txt%3A*)%20AND%20(price_has_discount_b%3A%22true%22))%20AND%20sorting_title%3A*%20AND%20*%3A*&sort=score%20desc,%20date_from%20desc&start=0&rows=99999&wt=json&bf=linear(ms(priority,NOW%2FHOUR),1.1e-11,0)")
			.then((response) => response.json())
			.then((responseJson) => {
				console.log("got games on sale-> ", responseJson.response.docs);
				resolve(responseJson.response.docs);
			})
			.catch((error) => {
				console.log("err getting games -> ", error);
				reject(error);
			});
		});
	}

	fetchGames(){
		return new Promise((resolve, reject) => {
			fetch("https://searching.nintendo-europe.com/pt/select?q=*&fq=type:GAME%20AND%20((playable_on_txt:%22HAC%22)%20AND%20(dates_released_dts:%5B*%20TO%20NOW%5D%20AND%20nsuid_txt:*))%20AND%20sorting_title:*%20AND%20*:*&sort=score%20desc,%20date_from%20desc&start=0&rows=99999&wt=json&bf=linear(ms(priority,NOW%2FHOUR),1.1e-11,0)")
			.then((response) => response.json())
			.then((responseJson) => {
				console.log("got games from API -> ", responseJson.response.docs);
				resolve(responseJson.response.docs);
			})
			.catch((error) => {
				console.log("err getting games -> ", error);
				reject(error);
			});
		});
	}

	get50Prices(nsuIDs){
		return new Promise((resolve, reject) => {
			fetch("https://api.ec.nintendo.com/v1/price?country=PT&lang=en&ids=" + nsuIDs.join(','))
			.then((response) => response.json())
			.then((responseJson) => {
				console.log("got prices -> ", responseJson.prices);
				resolve(responseJson.prices);
			})
			.catch((error) => {
				console.log("err getting prices -> ", error);
				reject(false);
			});
		});
	}

	fetchPrices(games){
		return new Promise((resolve, reject) => {
			let hasError = false;
			let errChunks = [];
			let finalPrices = [];
			let chunkedGames = _.chunk(games, 50);
			let finalFunc = _.after(chunkedGames.length, function() {
				if(hasError == true){
					console.log('done getting prices with error!');
					reject();
				} else {
					console.log('done getting prices -> ', finalPrices);
					resolve(finalPrices);
				}
			});
			for (const chunk of chunkedGames) {
				let pricechunk = chunk.map((val) => { return val.nsuid[0]});
				this.get50Prices(pricechunk).then(
					(res) => {
						let pricesReg = res.map((val) => {
							let tmp_id = _.find(chunk, function(o) { if(o.nsuid[0] == val.title_id) return true; });
							let tmpVal = { priceInf: val, game_id: tmp_id._id };
							return tmpVal;
						});
						finalPrices = _.union(finalPrices, pricesReg)
						// finalPrices.push(pricesReg);
						finalFunc();
					},
					(err) => {
						finalFunc();
						hasError = true;
						errChunks.push(chunk);
					}
				);;
			}
		});
	}

	insertGames(games){
		return new Promise((resolve, reject) => {
			global.gamesDB.insertAsync(games).then(
				(res) => {
					console.log(res.length + " games inserted");
					resolve();
				},
				(errInsert) => {
					console.log("error inserting games -> ", errInsert);
					reject(errInsert);
				}
			);
		});
	}

	updateEverything() {
		this.setState({
			spinner: true
		});
		console.log("getting games");
		this.fetchGames()
		.then(
			(games) => {
				this.removeEverything();
				const filterGames = games.map((val, index) => {
					return { 
						title: val.title,
						fsID: val.fs_id,
						image: val.image_url,
						nsuid: val.nsuid_txt,
						sortTitle: val.sorting_title,
						isOnSale: val.price_has_discount_b,
						salePercentage: val.price_discount_percentage_f,
						releaseDates: val.dates_released_dts,
						topScore: index,
						lastUpdated: new Date()
					}
				});
				this.insertGames(filterGames).then(
					(res) => {
						this.updatePrices();
					},
					(err) => {
						this.setState({
							spinner: false
						});
					}
				);
			},
			(err) => {
				this.setState({
					spinner: false
				});
			}
		);
	}

	removeEverything(){
		global.gamesDB.remove({}, { multi: true });
		global.gamePricesDB.remove({}, { multi: true });
	}

	updatePrices(){
		this.setState({
			spinner: true
		});
		this.queryGames().then(
			(games) => {
				this.fetchPrices(games).then(
					(res) => {
						this.insertPricesBD(res)
						.then(
							(resFinal) => {
								this.setState({
									spinner: false
								});
							},
							(err) => {
								this.setState({
									spinner: false
								});
							}
						);
					},
					(err) => {
						this.setState({
							spinner: false
						});
					}
				);
			},
			(err) => {
				this.setState({
					spinner: false
				});
			}
		);
	}

	insertPricesBD(prices){
		return new Promise((resolve, reject) => {
			prices = prices.map((val) => { 
				val.created_date = new Date();
				return val;
			});
			global.gamePricesDB.insertAsync(prices).then(
				(res) => {
					console.log(res.length + " prices inserted");
					resolve();
				},
				(errInsert) => {
					console.log("error inserting prices -> ", errInsert);
					reject(errInsert);
				}
			);
		});
	}

	queryGames(){
		return new Promise((resolve, reject) => {
			global.gamesDB.find({}).sort({ topScore: 1 }).exec(function (err, docs) {
				if(err){
					console.log("error finding games -> ", err);
					reject(err);
				} else {
					console.log("Got games! -> ", docs);
					resolve(docs);
				}
			});
		});
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
  }
});
