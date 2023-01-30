# GoodWe-PV
A Solar Module for MagicMirror2 designed to integrate with a GoodWe System

## Dependencies
  * A [MagicMirror<sup>2</sup>](https://github.com/MichMich/MagicMirror) installation

## Installation
  1. Clone repo into MagicMirror/modules directory
  2. Create an entry in 'config/config.js' with your username, password and powerstationId and other options.

 **Example:**
```
 {
  module: 'GoodWe-PV',
  position: 'bottom_left',
  config: {
    username: "test@gmail.com",
    password: "test",
    powerstationId: "1234"
  }
 },
```
**Note:** Only enter your credentials in the `config.js` file. Your credentials are yours alone, _do not_ post or use it elsewhere.