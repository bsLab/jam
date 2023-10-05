jamConfig={
  "startJam": true,
  "startNetwork": false,
  "loadAgents": [
    "chat.js"
  ],
  "startAgents": {
    "chat": {
      "demo": false
    }
  },
  "network": [
    {
      "ip": "localhost",
      "ipport": 10001,
      "enable": false
    },
    {
      "ip": "192.168.2.121",
      "ipport": 10001,
      "enable": false
    },
    {
      "enable": true,
      "ip": "10.10.10.2",
      "ipport": 10001
    },
    {}
  ],
  "capabilities": [
    "[E9:E7:1C:61:62:D4](0(FF)[C8:91:CA:EF:34:CD])",
    "",
    "",
    ""
  ],
  "log": {
    "agent": true,
    "parent": false,
    "time": false,
    "Time": true,
    "class": false
  },
  "default": false,
  "verbose": 0,
  "popupLevel": 1,
  "version": "1.1.39M"
}