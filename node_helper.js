/* eslint-disable prettier/prettier */
var fetch = require("node-fetch");
var NodeHelper = require("node_helper");

const loginUrl = "https://www.semsportal.com/api/v2/Common/CrossLogin";
const powerStationURLPart = "/v2/PowerStation/GetMonitorDetailByPowerstationId";
var SEMSToken = null;
var APIUrl = null;

module.exports = NodeHelper.create({	
	// Override start method.
	start: async function () {
		console.log("Starting node helper: " + this.name);
	},

	loginUser: function(configPayload) {
		const loginDetails = {
			account: configPayload.username,
			pwd: configPayload.password,
		}

		const tokenHeader = {
			version: "",
			client: "ios",
			language: "en"
		}

		const options = {
			method: "POST", 
			body: JSON.stringify(loginDetails),
			headers: {
				"Content-Type": "application/json", 
				"Accept": "application/json",
				"token": JSON.stringify(tokenHeader)
			}
		}

		return fetch(loginUrl, options).then((res) => {
			if (res.ok) {
				console.log(`\x1b[32m[SEMS-API][${res.status}] - Authenticated\x1b[0m`);
				return res.json();
			} else {
				console.log("Something went wrong")
			}
		}).then((data) => {
			return data;
		})
	},

	socketNotificationReceived: async function (notification, payload) {
		var self = this;

		if (notification === "GET_SOLAR") {
			const getInfoUrl = APIUrl + powerStationURLPart;

			const powerStationDetails = {
				powerStationId: payload.config.powerstationId
			}

			const options = {
				method: "POST", 
				body: JSON.stringify(powerStationDetails),
				headers: {
					"Content-Type": "application/json", 
					"Accept": "application/json",
					"token": JSON.stringify(SEMSToken)
				}
			}

		 	fetch(getInfoUrl, options).then((res) => {
				if (res.ok) {
					console.log(`\x1b[32m[SEMS-API][${res.status}] - Received Solar Data\x1b[0m`);
					return res.json();
				} else {
					console.log("Something went wrong")
				}
			}).then((data) => {
				// return the data part of the api response
				self.sendSocketNotification("SOLAR_DATA", data["data"]);
			})
		} else if (notification === "LOGIN_USER") {
			await this.loginUser(payload).then((res) => {
				SEMSToken = res["data"];
				APIUrl = res["api"]
				
				self.sendSocketNotification("LOGIN_USER", "Success");	
			});
		}
	}
});

