/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        // Sensors
        document.getElementById("myState").innerHTML="<b>Ready. Starting...</b>";
        
        function listener1(event) {
          // event.values[]
          document.getElementById("mySensor1").innerHTML="<b>Light: "+(Number(event.values[0])|0)+"</b>";
        }
        sensors.addSensorListener("LIGHT", "GAME", listener1, function(error) {
          if (error) document.getElementById("mySensor1").innerHTML="<b>Could not listen to sensor LIGHT</b>";
          else document.getElementById("mySensor1").innerHTML="<b>LIGHT enabled.</b>";
        });

        function listener2(event) {
          // event.values[]
          document.getElementById("mySensor2").innerHTML="<b>Sensor 2: "+(event.values.map(function (v) {
            return Number(v)|0}).join(','))+"</b>";
        }
        sensors.addSensorListener("MAGNETIC_FIELD", "GAME", listener2, function(error) {
          if (error) document.getElementById("mySensor2").innerHTML="<b>Could not listen to sensor 2</b>";
          else document.getElementById("mySensor2").innerHTML="<b>Sensor 2 enabled.</b>";
        });
        
        document.getElementById("myState").innerHTML="<b>Ready. Started "+jamConfig.version+"</b>";

        var i=0;
        setInterval(function () {
          document.getElementById("myState").innerHTML="<b>Ready. "+jamConfig.version+" Checkpoint "+i+".</b>";
          i++;
        },1000);

        console.log('Received Event: ' + id);

    }
};

app.initialize();
