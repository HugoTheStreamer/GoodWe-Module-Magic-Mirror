/* eslint-disable prettier/prettier */
Module.register("GoodWe-PV", {
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
        this.currentPowerTotal = "";
        this.totalCapacity = 5600; //TODO make config variable 
        this.loaded = false;

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

    //Handle node helper response
    socketNotificationReceived: function(notification, payload) {
        if (notification === "SOLAR_DATA") {
            var currentPower = payload.inverter[0].out_pac + payload.inverter[1].out_pac

            if (currentPower > 1000) {
                // if more than 1000W is being generated in total, we should display it in kW. 
                this.currentPowerTotal = (currentPower / 1000).toFixed(2) + " kW";
            } else {
                this.currentPowerTotal = currentPower + " W";
            }

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

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");
        
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
            img.src = "/modules/GoodWe-PV/solar_white.png";
        } else {
            img.src = "/modules/GoodWe-PV/moon.png";
        }

        var sTitle = document.createElement("p");
        sTitle.innerHTML = "Totaal: " + this.currentPowerTotal;
        sTitle.className += " thin normal";
        imgDiv.appendChild(img);
        imgDiv.appendChild(sTitle);

        var divider = document.createElement("hr");
        divider.className += " dimmed";

        for (let i=0; i < this.inverters.length; i++) {
            // display info about our inverters in tables
            const inverter = this.inverters[i];

            var title = document.createElement("h2");
            title.innerHTML = inverter.name;
            title.className += " thin normal no-margin";
    
            wrapper.appendChild(title);

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
        		titleTr.className += " medium regular bright";
        		dataTr.classname += " medium light normal";

        		row.appendChild(titleTr);
        		row.appendChild(dataTr);

        		tb.appendChild(row);
            }

            wrapper.appendChild(tb);
        }

        // append the devider and total at the bottom
        wrapper.appendChild(divider);
        wrapper.appendChild(imgDiv);
        var content = document.createElement("div");
        content.className += "content";

        var gaugeDiv = document.createElement("div");
        gaugeDiv.className += "box gauge--1";
        content.appendChild(gaugeDiv);

        var maskDiv = document.createElement("div");
        maskDiv.className += "mask";

        gaugeDiv.appendChild(maskDiv);

        var semiCircle = document.createElement("div");
        semiCircle.className += "semi-circle";

        var semiCircleMask = document.createElement("div");
        semiCircleMask.className += "semi-circle--mask";

        // calculate percentage
        const math = (parseInt(this.currentPowerTotal) / parseInt(this.totalCapacity)) * 100;
        const value = Math.round(math) * 10;
        semiCircleMask.style.transform = `rotate(${value}deg) translate3d(0, 0, 0)`;

        maskDiv.appendChild(semiCircle);
        maskDiv.appendChild(semiCircleMask);

        var chartBox = document.createElement("div");
        chartBox.className += "power-div";
        chartBox.innerHTML = this.currentPowerTotal;

        content.appendChild(chartBox);

        wrapper.appendChild(content);


        semiCircleMask.style.transform = `rotate(${value}deg) translate3d(0, 0, 0)`;

        return wrapper;
    }
});
