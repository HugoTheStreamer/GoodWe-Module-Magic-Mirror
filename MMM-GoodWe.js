/* eslint-disable prettier/prettier */
Module.register("MMM-GoodWe", {
    // Default module config.
    defaults: {
        refInterval: 1000 * 60 * 5, //5 minutes
        basicHeader: false,
    },

    start: async function() {
        // Logging appears in Chrome developer tools console
        Log.info("Starting module: " + this.name);

        this.titles = ["Huidig Vermogen", "Vandaag opgewekt", "Totaal opgewekt", "Huidig Vermogen", "Vandaag opgewekt", "Totaal opgewekt"];
        this.suffixes = ["kW", "kWh", "kWh", "kW", "kWh", "kWh"];
        this.inverters = [];
        this.currentPowerTitle = "";
        this.currentPowerTotal = 0;
        this.totalCapacity = 5600;
        this.loaded = false;

        if (this.config.totalCapacity !== 0) {
            this.totalCapacity = this.config.totalCapacity;
        }

        if (this.config.updateIntervalMinutes >= 1) {
            // if an interval was set through the config, update the interval time
            this.config.refInterval = 1000 * 60 * this.config.updateIntervalMinutes;
        }

        // get our token so that we can request our data
        this.authenticateUser();

        if (this.config.basicHeader) {
            this.data.header = 'GoodWe PV';
        }

        var self = this;
        //Schedule updates
        setInterval(function() {
            self.getSolarData();
            self.updateDom();
        }, this.config.refInterval);
    },

    //Import additional CSS Styles
    getStyles: function() {
    return ['solar.css']
    },

    authenticateUser: function() {
        Log.info("SolarApp: Retrieving Token"); 

        this.sendSocketNotification("LOGIN_USER", this.config);
    },

    //Contact node helper for solar data
    getSolarData: function() {
        Log.info("SolarApp: getting data");

        this.sendSocketNotification("GET_SOLAR", {
            config: this.config
        });
    },

    // Handle node helper response
    socketNotificationReceived: function(notification, payload) {
        if (notification === "SOLAR_DATA") {
            var currentPower = payload.inverter[0].out_pac + payload.inverter[1].out_pac

            if (currentPower > 1000) {
                // if more than 1000W is being generated in total, we should display it in kW. 
                this.currentPowerTitle = (currentPower / 1000).toFixed(2) + " kW";
            } else {
                this.currentPowerTitle = currentPower + " W";
            }

            this.currentPowerTotal = currentPower;

            for (let i=0; i < payload.inverter.length; i++) {
                // setup our array with inverters from the returned payload by SEMS
                this.inverters[i] = payload.inverter[i];
            }

            this.loaded = true;
            this.updateDom(1000);
        } else if (notification === "LOGIN_USER") {
            Log.info(`%c[SEMS-API][OK] - Authenticated`, "color: green");
            this.getSolarData();
        }
    },

    // Override dom generator
    getDom: function() {
        var wrapper = document.createElement("div");
        wrapper.className += "content-wrapper"
        
        if (this.config.username === "" || this.config.password === "") {
            wrapper.innerHTML = "Missing configuration.";
            return wrapper;
        }

        // Display loading while waiting for API response
        if (!this.loaded) {
      	    wrapper.innerHTML = "Loading...";
            return wrapper;
      	}

        var imgDiv = document.createElement("div");
        var img = document.createElement("img");

        const hours = new Date().getHours()
        const isDayTime = hours > 6 && hours < 20;  
        
        if (isDayTime) {
            img.src = "/modules/MMM-GoodWe/solar_white.png";
        } else {
            img.src = "/modules/MMM-GoodWe/moon.png";
        }

        var sTitle = document.createElement("p");
        sTitle.innerHTML = "Totaal: " + this.currentPowerTitle;
        sTitle.className += " thin normal content-title";
        imgDiv.appendChild(img);
        imgDiv.appendChild(sTitle);

        var divider = document.createElement("hr");
        divider.className += " dimmed";

        if (this.config.showInverterGauges) {
            var gaugeRow = document.createElement("div");
            gaugeRow.className += "gauge-box";
    
            for (let i=0; i < this.inverters.length; i++) {
                // display a gauge for each inverter
                const inverter = this.inverters[i];
    
                // if the inverter is offline, don't display a gauge
                if (inverter.invert_full.status !== 1) continue;
    
                var capacity = inverter.dict.left.filter(elem => elem.key === "capacity")[0].value;
                var currentPower = inverter.dict.left.filter(elem => elem.key === "InverterPowerOfPlantMonitor")[0].value;
                var currentPowerTitleLine = inverter.d.output_power;
    
                if (currentPower < 1) {
                    // convert to Watt if it is a small number in kW
                    currentPower = (currentPower * 1000).toFixed(0);
                    capacity = (capacity * 1000).toFixed(0);
                }
    
                // build the gauge
                var inverterWrap = document.createElement("div");
                inverterWrap.className += "ring ring--small";
    
                var gaugeInverter = document.createElement("div");
                gaugeInverter.className += "ring-value";
                inverterWrap.appendChild(gaugeInverter);
    
                var maskWrap = document.createElement("div");
                maskWrap.innerHTML = currentPowerTitleLine;
    
                gaugeInverter.appendChild(maskWrap);
    
                // calculate the percentage
                const calculation = (parseInt(currentPower) / parseInt(capacity)) * 100;
                var degree = Math.round(calculation) * 10;
    
                if (degree >= 360) {
                    // 360 is our max. degree and may not be proceeded.
                    degree = 360;
                }
    
                // set the circle radius
                inverterWrap.style.backgroundImage = `radial-gradient(white 0, white 50%, transparent 50%, transparent 100%), conic-gradient(green ${degree}deg, white 5deg, rgb(184, 184, 184) 0deg)`;
    
                // append the gauge to the flexbox
                gaugeRow.appendChild(inverterWrap);
            }
    
            // append our gauges at the top
            wrapper.appendChild(gaugeRow);
        }

        if (this.config.showInterverDetail) {
            for (let i=0; i < this.inverters.length; i++) {
                // display additional info about our inverters in tables
                const inverter = this.inverters[i];
        
                var title = document.createElement("h2");
                title.innerHTML = inverter.name;
                title.className += " thin normal no-margin content-title";
                wrapper.appendChild(title);
    
                if (inverter.invert_full.status !== 1) {
                    // this inverter is offline, display a message
                    var offlineTitle = document.createElement("h2");
                    offlineTitle.innerHTML = "Offline";
                    offlineTitle.className += " thin normal no-margin content-title offline-status";
    
                    wrapper.appendChild(offlineTitle);
    
                    // continue to next inverter
                    continue;
                }
    
                var tb = document.createElement("table");
    
                const resultsArray = [];
                resultsArray[0] = inverter.d.output_power;
                resultsArray[1] = inverter.eday + " kWh";
                resultsArray[2] = inverter.etotal + " kWh";
    
                for (let j=0; j < resultsArray.length; j++) {
                    var row = document.createElement("tr");
    
                    var titleTr = document.createElement("td");
                    var dataTr = document.createElement("td");
    
                    titleTr.innerHTML = this.titles[j];
                    dataTr.innerHTML = resultsArray[j];
                    titleTr.className += " medium regular bright title-row";
                    dataTr.classname += " medium light normal title-row";
    
                    row.appendChild(titleTr);
                    row.appendChild(dataTr);
    
                    tb.appendChild(row);
                }
    
                wrapper.appendChild(tb);
            }
        }
        
        // append the devider and total at the bottom
        wrapper.appendChild(divider);
        wrapper.appendChild(imgDiv);

        if (this.config.showBottomTotalGauge) {
            // setup bottom gauge
            var totalGauge = document.createElement("div");
            totalGauge.className += "ring ring--total";

            var gaugeDiv = document.createElement("div");
            gaugeDiv.className += "ring-value";
            totalGauge.appendChild(gaugeDiv);

            var maskDiv = document.createElement("div");
            maskDiv.innerHTML = this.currentPowerTitle;

            gaugeDiv.appendChild(maskDiv);

            // calculate percentage
            const math = (parseInt(this.currentPowerTotal) / parseInt(this.totalCapacity)) * 100;
            var value = Math.round(math) * 10;

            if (value >= 360) {
                value = 360;
            }

            totalGauge.style.backgroundImage = `radial-gradient(white 0, white 50%, transparent 50%, transparent 100%), conic-gradient(green ${value}deg, white 5deg, rgb(184, 184, 184) 0deg)`;

            wrapper.appendChild(totalGauge);            
        }

        // return our document
        return wrapper;
    }
});
