import React from "react";
import firebase from "firebase/app";
import { defaults } from "react-chartjs-2";
import { Link } from "react-router-dom";
import "chartjs-plugin-annotation";

import News from "./News.js";
import Leftbar from "../Elements/leftbar";
import Topbar from "../Elements/topbar";
import Loader from "../Elements/Loader.js";
import FullChart from "./FullChart";
import KeyInfo from "./KeyInfo";
import Firebase from "firebase";


const db = firebase.firestore();

var options = {
	layout: {
		padding: {
			right: 25,
			left: 25,
		},
	},
	tooltips: {
		mode: "index",
		intersect: false,
		callbacks: {
			label(tooltipItems, data) {
				return `$${tooltipItems.yLabel}`;
			},
		},
		displayColors: false,
	},
	hover: {
		mode: "index",
		intersect: false,
	},
	maintainAspectRatio: false,
	responsive: true,
	legend: {
		display: false,
	},
	scales: {
		xAxes: [
			{
				display: false,
			},
		],
		fontStyle: "bold",
		yAxes: [
			{
				gridLines: {
					color: "rgba(0, 0, 0, 0)",
				},
				fontStyle: "bold",

				ticks: {
					callback(value) {
						return "$" + value.toFixed(2);
					},
				},
			},
		],
	},
	elements: {
		point: {
			radius: 0,
		},
		line: {
			borderCapStyle: "round",
			borderJoinStyle: "round",
		},
	},
};

const apiKeys = [
	"AR71RDV9VX7DN1N4",
	"AR71RDV9VX7DN1N4",
	"AR71RDV9VX7DN1N4",
	"AR71RDV9VX7DN1N4"
];

let symbol;

// CHARTS

let chartData1 = [];
let labels = [];
let symbolsOnly = [];
let closePrice;
let stockData = {};
let keyData = [];
let keyDataLabel = [];
let allSymbols = [];


let watchlist = [];

let oneDay = [];
let oneDayLabels = [];

let oneYear = [];
let oneYearLabels = [];

let oneMonth = [];
let oneMonthLabels = [];

export default class stockPage extends React.Component {
	_isMounted = false;
	constructor(props) {
		super(props);
		this.state = {
			loaded: "",
			fundsWithoutCommas: "",
			accountValue: "",
			changeColor: "",
			extendedColor: "",
			marketStatus: "",
			valid: "",
			latestPrice: "",
			buyConfirmation: "",
			fillColor: null,
		};
		this.results = React.createRef();
		this.buyInput = React.createRef();
		this.searchBar = React.createRef();
		this.searchBarEl = React.createRef();
		this.day = React.createRef();
		this.month = React.createRef();
		this.year = React.createRef();
		this.bookmark = React.createRef();

		this.searchStocks = this.searchStocks.bind(this);
		this.changeFocus = this.changeFocus.bind(this);
		this.getWatchlist = this.getWatchlist.bind(this);
		this.handleWatchlist = this.handleWatchlist.bind(this);
		this.getOneDayChart = this.getOneDayChart.bind(this);
		this.getOneMonthChart = this.getOneMonthChart.bind(this);
    	this.getOneYearChart = this.getOneYearChart.bind(this);

		this.data1 = (canvas) => {
			const ctx = canvas.getContext("2d");
			const gradient = ctx.createLinearGradient(0, 0, 600, 10);
			gradient.addColorStop(0, "#7c83ff");
			gradient.addColorStop(1, "#7cf4ff");
			let gradientFill = ctx.createLinearGradient(0, 0, 0, 100);
			gradientFill.addColorStop(0, "rgba(124, 131, 255,.3)");
			gradientFill.addColorStop(0.2, "rgba(124, 244, 255,.15)");
			gradientFill.addColorStop(1, "rgba(255, 255, 255, 0)");
			ctx.shadowBlur = 5;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 4;
			return {
				labels,
				datasets: [
					{
						lineTension: 0.1,
						label: "",
						pointBorderWidth: 0,
						pointHoverRadius: 0,
						borderColor: gradient,
						backgroundColor: gradientFill,
						pointBackgroundColor: gradient,
						fill: true,
						borderWidth: 2,
						data: chartData1,
					},
				],
			};
		};
	}

	numberWithCommas(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	/*
	 * searches stocks
	 * @param {e} value to search for
	 */

	searchStocks(e) {
		let results = this.results.current;
		results.innerHTML = "";
		let b = 0;
		let filter = this.searchBarEl.current.value.toUpperCase();
		if (e.key === "Enter") {
			window.location = `/stocks/${filter}`;
		}
		if (filter.length === 0) {
			results.innerHTML = "";
			results.style.display = "none";
		} else {
			for (let i = 0; i < allSymbols.length; i++) {
				let splitSymbol = allSymbols[parseInt(i)].symbol.split("");
				let splitFilter = filter.split("");
				for (let a = 0; a < splitFilter.length; a++) {
					if (
						allSymbols[parseInt(i)].symbol.indexOf(filter) > -1 &&
						splitSymbol[parseInt(a)] === splitFilter[parseInt(a)]
					) {
						if (a === 0) {
							results.style.display = "flex";
							let el = document.createElement("li");
							el.innerHTML = `<li><a href="/stocks/${
								allSymbols[parseInt(i)].symbol
							}"><h4>${allSymbols[parseInt(i)].symbol}</h4><h6>${
								allSymbols[parseInt(i)].name
							}</h6></a></li>`;
							results.appendChild(el);
							b++;
						}
					}
				}
				if (b === 10) {
					break;
				}
			}
		}
	}

	getOneDayChart() {
		const anno = {
			annotations: [
				{
					borderDash: [2, 2],
					drawTime: "afterDatasetsDraw",
					type: "line",
					mode: "horizontal",
					scaleID: "y-axis-0",
					value: closePrice,
					borderColor: "#676976",
					borderWidth: 1,
				},
			],
		};
		labels = [];
		chartData1 = [];
		let b = 0;
		if (oneDay.length === 0) {
			const stockApi = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&apikey=${apiKeys[0]}`;
			fetch(stockApi)
				.then((res) => res.json())
				.then((result) => {
					if (typeof result["Note"] === "undefined") {
						for (
							let i =
								Object.keys(result["Time Series (1min)"])
									.length - 1;
							i > 0;
							i--
						) {
							chartData1.push(
								parseFloat(
									result["Time Series (1min)"][
										Object.keys(
											result["Time Series (1min)"]
										)[parseInt(i)]
									]["4. close"]
								).toFixed(2)
							);
							labels.push(
								Object.keys(result["Time Series (1min)"])
									[parseInt(i)].split(" ")[1]
									.slice(0, -3)
							);
						}
					} else {
						setTimeout(() => {
							b++;
							const stockApi = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&apikey=${
								apiKeys[parseInt(b)]
							}`;
							fetch(stockApi)
								.then((res) => res.json())
								.then((result) => {
									for (
										let i =
											Object.keys(
												result["Time Series (1min)"]
											).length - 1;
										i > 0;
										i--
									) {
										chartData1.push(
											parseFloat(
												result["Time Series (1min)"][
													Object.keys(
														result[
															"Time Series (1min)"
														]
													)[parseInt(i)]
												]["4. close"]
											).toFixed(2)
										);
										labels.push(
											Object.keys(
												result["Time Series (1min)"]
											)
												[parseInt(i)].split(" ")[1]
												.slice(0, -3)
										);
									}
								});
						}, 500);
					}
				})
				.then(() => {
					setTimeout(() => {
						if (this._isMounted) {
							this.setState({
								loaded: true,
							});
							chartData1.map((val) => oneDay.push(val));
							labels.map((val) => oneDayLabels.push(val));
						}
					}, 1000);
				});
		} else {
			labels = oneDayLabels;
			chartData1 = oneDay;
			if (this._isMounted) {
				this.setState({
					loaded: true,
				});
			}
		}
		options.annotation = anno;
	}

	getOneYearChart() {
		labels = [];
		chartData1 = [];
		if (oneYear.length === 0) {
		  const stockApi = `https://cloud.iexapis.com/beta/stock/${symbol}/batch?token=${process.env.REACT_APP_IEX_KEY_1}&types=chart,quote&range=1y`;
		  fetch(stockApi)
			.then(res => res.json())
			.then(result => {
			  for (let i = 0; i < result.chart.length; i++) {
				if (result.chart[parseInt(i)].average !== null) {
				  chartData1.push(result.chart[parseInt(i)].close.toFixed(2));
				  labels.push(result.chart[parseInt(i)].label);
				}
			  }
			})
			.then(() => {
			  if (this._isMounted) {
				this.setState({
				  loaded: true,
				});
			  }
			  chartData1.map(val => oneYear.push(val));
			  labels.map(val => oneYearLabels.push(val));
			});
		} else {
		  labels = oneYearLabels;
		  chartData1 = oneYear;
		  if (this._isMounted) {
			this.setState({
			  loaded: true,
			});
		  }
		}
		options.annotation = "";
	  }

	  getOneMonthChart() {
		labels = [];
		chartData1 = [];
		if (oneMonth.length === 0) {
		  const stockApi = `https://cloud.iexapis.com/beta/stock/${symbol}/batch?token=${process.env.REACT_APP_IEX_KEY_1}&types=chart,quote&range=1m`;
		  fetch(stockApi)
			.then(res => res.json())
			.then(result => {
			  for (let i = 0; i < result.chart.length; i++) {
				if (result.chart[parseInt(i)].average !== null) {
				  chartData1.push(result.chart[parseInt(i)].close.toFixed(2));
				  labels.push(result.chart[parseInt(i)].label);
				}
			  }
			})
			.then(() => {
			  if (this._isMounted) {
				this.setState({
				  loaded: true,
				});
			  }
			  chartData1.map(val => oneMonth.push(val));
			  labels.map(val => oneMonthLabels.push(val));
			});
		} else {
		  labels = oneMonthLabels;
		  chartData1 = oneMonth;
		  if (this._isMounted) {
			this.setState({
			  loaded: true,
			});
		  }
		}
		options.annotation = "";
	  }

	
	/*
	 * converts number to short version of milions, bilions etc.
	 * @param {number} number to convert
	 * @param {decPlaces} how many decimal places
	 */
	abbrNum(number, decPlaces) {
		decPlaces = Math.pow(10, decPlaces);
		var abbrev = ["k", "m", "b", "t"];
		for (var i = abbrev.length - 1; i >= 0; i--) {
			var size = Math.pow(10, (i + 1) * 3);
			if (size <= number) {
				number = Math.round((number * decPlaces) / size) / decPlaces;
				if (number === 1000 && i < abbrev.length - 1) {
					number = 1;
					i++;
				}
				number += abbrev[parseInt(i)];
				break;
			}
		}

		return number;
	}
	/*
	 * check i value is in array
	 * @param {arr} array
	 * @param {val} value
	 */
	isInArray(arr, val) {
		return arr.indexOf(val) > -1;
	}

	/*
	 * changes look of buttons above chart
	 * @param {option} selected option
	 */

	changeFocus(option) {
		setTimeout(
			function () {
				var elems = document.querySelectorAll(".Chart__option");

				[].forEach.call(elems, function (el) {
					el.classList.remove("active");
				});
				switch (option) {
					case 1:
						this.day.current.classList.add("active");
						break;

					case 2:
						this.month.current.classList.add("active");
						break;

					case 3:
						this.year.current.classList.add("active");
						break;

					case 4:
						this.years.current.classList.add("active");
						break;

					case 5:
						this.ytd.current.classList.add("active");
						break;

					default:
						this.ytd.current.classList.add("active");
						break;
				}
			}.bind(this),
			200
		);
	}

	rendering() {
		fetch(
			`https://cloud.iexapis.com/stable/stock/${symbol}/quote?displayPercent=true&token=${process.env.REACT_APP_IEX_KEY_2}`
		)
			.then((res) => res.json())
			.then((result) => {
				stockData.changePercent = result.changePercent.toFixed(2);
				stockData.change = result.change.toFixed(2);

				closePrice = result.previousClose;

				stockData.name = result.companyName;
				stockData.previousClose = result.previousClose;
				stockData.latestTime = result.latestTime;
				stockData.extendedPrice = result.extendedPrice;
				if (result.extendedPrice === null) {
					stockData.extendedPrice = "";
					stockData.extendedChange = "";
				}
				stockData.extendedChange = result.extendedChange;
				if (this._isMounted) {
					this.setState({
						latestPrice: result.latestPrice.toFixed(2),
					});
				}
				keyData[0] = this.abbrNum(result.marketCap, 2);
				keyDataLabel[0] = "Market Cap ";
				keyData[1] = result.peRatio;
				keyDataLabel[1] = "PE Ratio (TTM) ";

				keyData[2] = "$" + result.week52High;
				keyDataLabel[2] = "52 week High";

				keyData[3] = "$" + result.week52Low;
				keyDataLabel[3] = "52 Week Low ";

				keyData[4] = result.ytdChange.toFixed(2) + "%";
				keyDataLabel[4] = "YTD Change ";

				keyData[5] = result.latestVolume;
				if (keyData[5] !== null) {
					keyData[5] = this.numberWithCommas(keyData[5]);
				} else {
					keyData[5] = "---";
				}
				keyDataLabel[5] = "Volume ";
			})
			.then(
				function () {
					if (stockData.change > 0 && this._isMounted) {
						this.setState({
							changeColor: "#3ae885",
						});
					} else if (stockData.change !== "0.00" && this._isMounted) {
						this.setState({
							changeColor: "#F45385",
						});
					} else if (this._isMounted) {
						this.setState({
							changeColor: "#999eaf",
						});
					}
					if (stockData.extendedChange > 0 && this._isMounted) {
						this.setState({
							extendedColor: "#66F9DA",
						});
					} else if (
						stockData.extendedChange !== "0.00" &&
						this._isMounted
					) {
						this.setState({
							extendedColor: "#F45385",
						});
					} else if (this._isMounted) {
						this.setState({
							extendedColor: "#999eaf",
						});
					}
				}.bind(this)
			);
		document.title = `StalkStock - ${symbol}`;
		fetch(
			`https://cloud.iexapis.com/stable/stock/${symbol}/quote?displayPercent=true&token=${process.env.REACT_APP_IEX_KEY_2}`
		)
			.then((res) => res.json())
			.then((result) => {
				if (this._isMounted) {
					this.setState({
						latestPrice: result.latestPrice.toFixed(2),
					});
				}
			})
			.then(() => {
				if (this.state.marketStatus) {
					setInterval(() => {
						fetch(
							`https://cloud.iexapis.com/stable/stock/${symbol}/quote?displayPercent=true&token=${process.env.REACT_APP_IEX_KEY_1}`
						)
							.then((res) => res.json())
							.then((result) => {
								if (this._isMounted) {
									this.setState({
										latestPrice: result.latestPrice.toFixed(
											2
										),
									});
								}
							});
					}, 5000);
				}
			});
		setTimeout(() => {
			if (!this.state.marketStatus && this.buyInput.current) {
				this.buyInput.current.disabled = true;
				this.buyInput.current.placeholder = "MARKET CLOSED";
			} else if (this.buyInput.current) {
				this.buyInput.current.disabled = false;
				this.buyInput.current.placeholder = "QUANTITY";
			}
		}, 1000);

		// this.getYTDChart();
		this.getOneDayChart();
		if (document.querySelector(".hamburger")) {
			document
				.querySelector(".hamburger")
				.addEventListener("click", (e) => {
					e.currentTarget.classList.toggle("is-active");
				});
		}
	}

	getWatchlist() {
		console.log("Watchlist");
		let user = firebase.auth().currentUser.uid;
		db.collection("users")
			.doc(user)
			.get()
			.then((doc) => {
				watchlist = doc.data()["watchlist"];
				console.log(watchlist);
				console.log(doc.data()["watchlist"]);
			})
			.then(() => {
				symbol = window.location.href.split("/")[
					window.location.href.split("/").length - 1
				];
				console.log(watchlist);
				if (watchlist.includes(symbol)) {
					this.setState({
						fillColor: "#ddd",
					});
				} else {
					console.log("else");
				}
			});
	}

	handleWatchlist() {
		let user = firebase.auth().currentUser.uid;
		symbol = window.location.href.split("/")[
			window.location.href.split("/").length - 1
		];
		if (watchlist.includes(symbol)) {
			db.collection("users")
				.doc(user)
				.update({
					watchlist: firebase.firestore.FieldValue.arrayRemove(
						symbol
					),
				});
			this.setState({
				fillColor: null,
			});
			var index = watchlist.indexOf(symbol);
			if (index !== -1) {
				watchlist.splice(index, 1);
			}
			console.log(watchlist);
		} else {
			db.collection("users")
				.doc(user)
				.update({
					watchlist: firebase.firestore.FieldValue.arrayUnion(symbol),
				});
			this.setState({
				fillColor: "#ddd",
			});
			watchlist.push(symbol);
			console.log(watchlist);
		}
	}
	handleBuyStock(num) {
		let user = firebase.auth().currentUser.uid;
		let positionsNumber;

		db.collection("users")
			.doc(user)
			.get()
			.then((doc) => {
				positionsNumber = doc.data()["positions"];
			})
			.then(() => {
				firebase
					.firestore()
					.collection("users")
					.doc(user)
					.collection("stocks")
					.doc("Position" + positionsNumber)
					.set({
						symbol,
						moneyPaid: (
							Number(num) * Number(this.state.latestPrice)
						).toFixed(2),
						shares: num,
						value: (
							Number(num) * Number(this.state.latestPrice)
						).toFixed(2),
					})
					.catch((error) => {
						console.log("Error getting document:", error);
					});
			})
			.then(() => {
				firebase
					.firestore()
					.collection("users")
					.doc(user)
					.update({
						currentfunds: (
							Number(this.state.fundsWithoutCommas) -
							Number(num) * Number(this.state.latestPrice)
						).toFixed(2),
						positions: Number(positionsNumber) + 1,
					})
					.catch((error) => {
						console.log("Error getting document:", error);
					});
			})
			.then(() => {
				this.getFunds();
				if (this._isMounted) {
					this.setState({
						buyConfirmation: false,
					});
				}
			});
	}
	getFunds() {
		if (this._isMounted) {
			this.setState({
				fundsWithoutCommas: "",
			});
		}
		let user = firebase.auth().currentUser.uid;
		let docRef = db.collection("users").doc(user);
		console.log(docRef)

		docRef
			.get()
			.then((doc) => {
				console.log(doc)
				if (this._isMounted) {
					this.setState({
						funds:
							"$" +
							this.numberWithCommas(doc.data()["currentfunds"]),
					});
					this.setState({
						fundsWithoutCommas: doc.data()["currentfunds"],
					});
				}
			})
			.catch(function (error) {
				console.log("Error getting document:", error);
			});
	}
	componentDidMount() {
		this._isMounted = true;
			fetch(
				`https://financialmodelingprep.com/api/v3/is-the-market-open?apikey=${process.env.REACT_APP_FMP_KEY}`
			)
				.then((res) => res.json())
				.then((result) => {
					console.log(result.isTheStockMarketOpen)
					if(this._isMounted){
						this.setState({
							marketStatus: result.isTheStockMarketOpen,
						})
					}
				});
		let data = Firebase.database().ref("/");
		data.once("value", (snapshot) => {
			snapshot.val().map((index) => {
				symbolsOnly.push(index.symbol);
			});
		}).then(() => {
			symbol = window.location.href.split("/")[
				window.location.href.split("/").length - 1
			];
			setTimeout(() => {
				if (this.isInArray(symbolsOnly, symbol)) {
					if (this._isMounted) {
						this.setState({ valid: true });
						console.log(this.state.valid);
					}
					this.rendering();
				} else if (this._isMounted) {
					this.setState({ valid: false });
					console.log(this.valid);
				}
			}, 1000);
		});
		this.getFunds();
		this.getWatchlist();
		// this.runState();
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	render() {
		return (
			<section className="stock">
				{this.state.buyConfirmation === true && (
					<div className="black-bg" />
				)}
				{this.state.buyConfirmation === true && (
					<div className="buyConfirmation">
						<h3>
							Are you sure you want to buy{" "}
							{this.buyInput.current.value} shares of {symbol} for{" "}
							<span style={{ fontWeight: "bold" }}>
								{parseFloat(
									(
										this.buyInput.current.value *
										this.state.latestPrice
									).toFixed(2)
								)}
							</span>{" "}
							dollars
						</h3>
						<div>
							<button
								className="stockPage__buy-button"
								onClick={() => {
									if (
										this.buyInput.current.value *
											this.state.latestPrice <=
										this.state.fundsWithoutCommas
									) {
										this.handleBuyStock(
											this.buyInput.current.value
										);
									} else if (this._isMounted) {
										this.setState({
											buyConfirmation: false,
										});
									}
								}}
							>
								CONFIRM
							</button>
							<button
								className="stockPage__buy-button cancel"
								onClick={() => {
									if (this._isMounted) {
										this.setState({
											buyConfirmation: false,
										});
									}
								}}
							>
								CANCEL
							</button>
						</div>
					</div>
				)}
				{this.state.valid === "" && <Loader />}
				{this.state.valid && (
					<div style={{ display: "flex", height: "100%" }}>
						<Leftbar />
						<div className="stockPage">
							<Topbar />
							{this.state.loaded ? (
								<div className="stockPage__top">
									<FullChart
										changeFocus={this.changeFocus}
										getOneDayChart={this.getOneDayChart}
										getOneMonthChart={this.getOneMonthChart}
                    					getOneYearChart={this.getOneYearChart}
										data1={this.data1}
										stockData={stockData}
										day={this.day}
										year={this.year}
										month={this.month}
									/>
									<div className="stockPage__trade">
										<div className="stockPage__mobile">
											<div
												style={{
													display: "flex",
													flexDirection: "row",
													justifyContent:
														"flex-start",
													alignItems: "flex-start",
												}}
											>
												<h4>{stockData.name}</h4>
												<svg
													id="bookmark"
													ref={this.bookmark}
													xmlns="http://www.w3.org/2000/svg"
													width="25"
													height="25"
													viewBox="0 0 24 24"
													fill="none"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke="#ddd"
													style={{
														fill: this.state
															.fillColor,
														cursor: "pointer",
													}}
													onClick={
														this.handleWatchlist
													}
												>
													<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
												</svg>
											</div>
											<div className="stockPage__trade-top">
												<h2>
													${this.state.latestPrice}
												</h2>
												<h6
													style={{
														color: this.state
															.changeColor,
													}}
												>
													{stockData.change} (
													{stockData.changePercent}%)
												</h6>
											</div>
										</div>
										{!this.state.marketStatus &
										(stockData.extendedChange !== null) ? (
											<h6>
												Extended Hours:{" "}
												<span
													style={{
														color: this.state
															.extendedColor,
													}}
												>
													${stockData.extendedPrice} (
													{stockData.extendedChange})
												</span>
											</h6>
										) : (
											<div />
										)}
										<h5>Buy {symbol}</h5>
										<div className="stockPage__buy-container">
											<input
												autoCorrect="off"
												autoCapitalize="off"
												spellCheck="false"
												className="stockPage__buy-input"
												ref={this.buyInput}
												id="buy-input"
												type="number"
												// disabled={true}
											/>

											<button
												onClick={function () {
													let value = this.buyInput
														.current.value;
													if (
														value.length > 0 &&
														value > 0 &&
														value *
															this.state
																.latestPrice <=
															this.state
																.fundsWithoutCommas &&
														this.state
															.marketStatus &&
														this._isMounted
													) {
														this.setState({
															buyConfirmation: true,
														});
													} else {
														this.buyInput.current.style.border =
															"solid 1px #f45485";
													}
												}.bind(this)}
												className="stockPage__buy-button"
											>
												BUY
											</button>
										</div>
									</div>
								</div>
							) : (
								<Loader />
							)}
							<div className="stockPage__keyStats">
								<KeyInfo
									keyDataLabel={keyDataLabel}
									keyData={keyData}
								/>
								<div className="news">
									<h3>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
										>
											<g>
												<path
													fill="none"
													d="M0 0h24v24H0z"
												/>
												<path d="M4.929 2.929l1.414 1.414A7.975 7.975 0 0 0 4 10c0 2.21.895 4.21 2.343 5.657L4.93 17.07A9.969 9.969 0 0 1 2 10a9.969 9.969 0 0 1 2.929-7.071zm14.142 0A9.969 9.969 0 0 1 22 10a9.969 9.969 0 0 1-2.929 7.071l-1.414-1.414A7.975 7.975 0 0 0 20 10c0-2.21-.895-4.21-2.343-5.657L19.07 2.93zM7.757 5.757l1.415 1.415A3.987 3.987 0 0 0 8 10c0 1.105.448 2.105 1.172 2.828l-1.415 1.415A5.981 5.981 0 0 1 6 10c0-1.657.672-3.157 1.757-4.243zm8.486 0A5.981 5.981 0 0 1 18 10a5.981 5.981 0 0 1-1.757 4.243l-1.415-1.415A3.987 3.987 0 0 0 16 10a3.987 3.987 0 0 0-1.172-2.828l1.415-1.415zM12 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-1 2h2v8h-2v-8z" />
											</g>
										</svg>
										Latest News
									</h3>
									<News symbol={symbol} />
								</div>
							</div>
						</div>
					</div>
				)}
				{this.state.valid === false && (
					<div className="wrongSymbol">
						<h1>Unknown Symbol</h1>
						<div
							className="topbar__searchbar"
							ref={this.searchBar}
							id="topbar__searchbar"
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									width: "100%",
								}}
							>
								<svg
									enableBackground="new 0 0 250.313 250.313"
									version="1.1"
									viewBox="0 0 250.313 250.313"
									xmlSpace="preserve"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="m244.19 214.6l-54.379-54.378c-0.289-0.289-0.628-0.491-0.93-0.76 10.7-16.231 16.945-35.66 16.945-56.554 0-56.837-46.075-102.91-102.91-102.91s-102.91 46.075-102.91 102.91c0 56.835 46.074 102.91 102.91 102.91 20.895 0 40.323-6.245 56.554-16.945 0.269 0.301 0.47 0.64 0.759 0.929l54.38 54.38c8.169 8.168 21.413 8.168 29.583 0 8.168-8.169 8.168-21.413 0-29.582zm-141.28-44.458c-37.134 0-67.236-30.102-67.236-67.235 0-37.134 30.103-67.236 67.236-67.236 37.132 0 67.235 30.103 67.235 67.236s-30.103 67.235-67.235 67.235z"
										clipRule="evenodd"
										fillRule="evenodd"
									/>
								</svg>
								<input
									autoCorrect="off"
									autoCapitalize="off"
									spellCheck="false"
									type="text"
									id="searchBar"
									ref={this.searchBarEl}
									onKeyUp={this.searchStocks}
									placeholder="Search by symbol"
									onFocus={() => {
										if (this.results.current.firstChild) {
											this.results.current.style.display =
												"flex";
										}
										this.searchBar.current.style.boxShadow =
											"0px 0px 30px 0px rgba(0,0,0,0.10)";
										this.results.current.style.boxShadow =
											"0px 30px 20px 0px rgba(0,0,0,0.10)";
									}}
									onBlur={() => {
										setTimeout(() => {
											if (this.results.current) {
												this.results.current.style.display =
													"none";
											}
										}, 300);
										this.searchBar.current.style.boxShadow =
											"none";
									}}
									autoComplete="off"
								/>
							</div>
							<ul
								className="topbar__results"
								id="results"
								ref={this.results}
							/>
						</div>
						<h2>OR</h2>
						<h3>
							Go to <Link to="/dashboard">Dashboard</Link>
						</h3>
					</div>
				)}
			</section>
		);
	}
}
