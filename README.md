# MMM-GoodWe
A Solar Module for MagicMirror2 designed to integrate with a GoodWe System

## Dependencies
  * A [MagicMirror<sup>2</sup>](https://github.com/MichMich/MagicMirror) installation

## Installation
  1. Clone repo into MagicMirror/modules directory
  2. Create an entry in 'config/config.js' with your username, password and powerstationId and other options.

 **Example:**
```
{
    module: 'MMM-GoodWe',
    position: 'bottom_left',
    config: {
      username: "test@gmail.com", // Your GoodWe account email
      password: "test", // Your GoodWe Password
      powerstationId: "1234", // The ID of your powerstation
      totalCapacity: 5600, // The total capacity all your inverters can handle
      updateIntervalMinutes: 0, // How often the data should be refreshed, defaults to every 5 minutes unless set to a value higher than or equal to 1.
      showInverterGauges: true, // Show the gauges at the top
      showBottomTotalGauge: true, // Show the large gauge at the bottom
      showInterverDetail: true // Show the details of the inverters
    }
},
```
**Note:** Only enter your credentials in the `config.js` file. Your credentials are yours alone, _do not_ post or use it elsewhere.