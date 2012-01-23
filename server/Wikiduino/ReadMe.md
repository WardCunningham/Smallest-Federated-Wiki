Wikiduino: Federated Wiki for Arduino
=====================================

The Arduino is an open-source hardware and software platform designed for
artists and experimenters. Arduino boards employ one of several Atmel AVR 8-bit microcontrollers
along with an FDDI USB to serial converter for device programming and software debugging
from a custom made for purpose development environment. The Wikiduino configuration 
adds to this an Ethernet adapter daughter card (called a shield) and a variety of sensors.

The source code for Wikiduino exists in a single file which can be copied and pasted into the Arduino IDE or cloned directly from GitHub:

* Wikiduino.ino for use with release 1.0 or later

System Operation
================

The Arduino operating loop calls two service routines at high frequency:

* sample() -- Acquire and store new sensor data every second or so
* serve() -- Report saved data in response to server requests

Adding new sensors requires modifying the sample() routine to acquire new data and modifying the serve() routine to report newly sampled sensor data when requested via web service.

Installing Wikiduino in a new network environment requires modifying network addresses
and recompiling the program as is routine in the Arduino environment.

Device Limitations
==================

Wikiduino was built as much as a proof of concept as anything.
We struggled with Arduino's weak string manipulation and found that the device simply failed when its modest memory was exhausted.
Our solution was to chop literal strings into words that could be reassembled from shared parts.
We understand that [pjrc.com](http://pjrc.com/teensy/td_libs.html) distributes an Arduino compatible String Library which might relieve these problems.

Initial Deployment
==================

Our first deployment has been in a remote soil temperature sensing application.
We use Maxium DS18B20 digital thermometers on 20 to 50 foot runs of CAT-3 cable to reach the soil plots of interest.
We also sense environmental conditions in the garden shed including air temperature, battery voltage and ambient light.

Our directional WiFi transceiver draws several times the current as the Arduino/Ethernet setup.
We've adopted the policy of powering down the radio after five minutes of activity each hour.
The server software continues to run during this power-save period and could be accumulating data to be reported later.

We've described this installation in two DorkbotPDX blog posts:

* http://dorkbotpdx.org/blog/wardcunningham/remote_sensing_with_federated_wiki
* http://dorkbotpdx.org/blog/wardcunningham/wikiduino_deployed

A few more pointers to background work can be found in [issue #94](https://github.com/WardCunningham/Smallest-Federated-Wiki/issues/94) discussion.

Retrospective
=============

We've struggled to make Wikiduino serve content to the web from its placement in a remote environment.
Another approach would be to make the Arduino a client of some cloud-based server which would be the world's point of contact. The first approach met our goal of making an Arduino implementation of a Smallest Federated Wiki server. We acknowledge some pluses and minuses of our configuration:

* Plus: Several of us can retrieve information from the site without undue coordination.
* Plus: Additional sensor channels can be added with modification only at the server.
* Minus: Our power-saving strategy requires continually resetting the server clock to avoid drift.
* Minus: Direct internet access to the server requires our maintaining a tunnel through a firewall.

We also find it ironic that our WiFi transceiver has within it a full linux implementation capabable of remote administration during the periods that the 8-bit Arduino allows it to operate.
