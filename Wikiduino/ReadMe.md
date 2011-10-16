Wikiduino: Federated Wiki for Arduino
=====================================

The Arduino is an open-source hardware and software platform designed for
artists and experimenters. Arduino boards employ one of several Atmel AVR 8-bit microcontrollers
along with an FDDI USB to serial converter for device programming and software debugging
from a custom made for purpose development environment. The Wikiduino configuration 
adds to this an Ethernet adapter daughter card (called a shield) and a variety of sensors.

The source code for Wikiduino exists in a single file which can be copied and pasted into the Arduino IDE. We host two files that vary depending on which version of IDE and libraries one is 
using. These are:

* Wikiduino.pde for use with Arduino beta version 22
* Wikiduino.ino for use with release 1.0 or later

System Operation
================

The Arduino operating loop calls two service routines at high frequency:

* sample() -- Acquire and store new sensor data every second or so
* serve() -- Report saved data in response to server requests

Adding new sensors requires modifying the sample() routine to acquire new data and modifying the serve() routine to report newly sampled sensor data when requested via web service.
