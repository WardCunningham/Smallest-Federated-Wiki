
// Copyright (c) 2011, Ward Cunningham
// Released under MIT and GPLv2

#include <SPI.h>
#include <Ethernet.h>
#include <EthernetClient.h>
#include <EthernetServer.h>
#include <OneWire.h>
#define num(array) (sizeof(array)/sizeof(array[0]))

// pin assignments
byte radioPowerPin = 2;

// Ethernet Configuration

byte mac[] = { 0xEE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED   };
IPAddress ip(10, 94, 54, 2);
IPAddress gateway(10, 94, 54, 1);

//IPAddress ip(10, 0, 3, 201 );
//IPAddress gateway( 10, 0, 3, 1 );

//IPAddress ip(192, 168, 0, 201 );
//IPAddress gateway( 192, 168, 0, 1 );

IPAddress subnet( 255, 255, 255, 0 );

EthernetServer server(1111);
EthernetClient client(255);

unsigned long requests = 0;
unsigned long lastRequest = 0; // records the request number at time of the most recent radio powerup
byte radioPowerMode = 1; // indicates which power management algorith to use

// Sensor Configuration

OneWire ds(8);

int analog[3];
struct Temp {
  unsigned int code; 
  int data;
} temp[4] = {{0,0}};

unsigned int last = 100;
unsigned int powersave = 0;
unsigned long lastSample = 100;
unsigned long lastRadioOn = 0; // records time the radio was last powered on
unsigned long totalRadioOn = 0; // records total time the radio has been on
unsigned long now = 0;
unsigned long rollOvers = 0;
boolean topOfHourFlag = false;
unsigned long topOfHour = 0;
boolean radioOn = false; // status of radio power
unsigned long crc_errs = 0;

// Arduino Setup and Loop

void setup() {
  Serial.begin(115200L);
  Ethernet.begin(mac, ip, gateway, subnet);
  server.begin();
  // configure radio power control pin
  pinMode(radioPowerPin,OUTPUT);
  powerRadio(true);
}

void loop() {
  sample();    // every second or so
  pinMode(13,OUTPUT);
  digitalWrite(13,HIGH);
  serve();     // whenever web requests come in
  digitalWrite(13,LOW);
}

// Sample and Hold Analog and One-Wire Temperature Data

void sample() {
  now = millis();
  if ((now-lastSample) >= 1000) {
    if(now < lastSample) {
      rollOvers++;
    }
    lastSample = now;
    manageRadioPower();
    analogSample();
    tempSample();
  }
}

unsigned long modeOneOnTime = (58*60+30) * 1000UL;
unsigned long modeOneOffTime = (4*60+15) * 1000UL;
unsigned long modeTwoOnTime = (2*60+30) * 1000UL;
unsigned long modeTwoOffTime = (4*60+5) * 1000UL;
unsigned long longestOnTimeWithoutRequest = 3600*1000UL;

void manageRadioPower() {
  if(radioOn && (lastRequest == requests) && ((now-lastRadioOn) >= longestOnTimeWithoutRequest)) {
    // radio has been on for a while, but received no requests, may be wedged, try rebooting
    printTime(now,0); Serial.println(" Resetting radio");
    powerRadio(false);
    delay(2000);
    now = millis();
    powerRadio(true);
  } else {
    if(radioPowerMode == 0 || !topOfHourFlag) { // stay on
      if(!radioOn) {
        powerRadio(true);
      }
    } else {
      // remove integer hours from time, just interested in phase ... not needed if we get a sync often enough relative to wrapping
      while((now-topOfHour) > (3600*1000UL)) {
        topOfHour += 3600*1000UL;
      }
      unsigned long timeAfterHour = (now-topOfHour) % (3600*1000UL);
      if(radioPowerMode == 1) { // on at 58m30s, off at 4m15s after hour
        boolean duringOffTime = (timeAfterHour > modeOneOffTime) && (timeAfterHour < modeOneOnTime);
        if(radioOn && duringOffTime) {
          powerRadio(false);
        } else if (!radioOn && !duringOffTime) {
          powerRadio(true);
        }
      } else if(radioPowerMode == 2) { // minimal radio uptime on at 2m30s, off at 4m5s after hour
        boolean duringOnTime = (timeAfterHour > modeTwoOnTime) && (timeAfterHour < modeTwoOffTime);
        if(radioOn && !duringOnTime) {
          powerRadio(false);
        } else if (!radioOn && duringOnTime) {
          powerRadio(true);
        }
      }
    }
  }
}

void printTime(unsigned long t,unsigned long ref) {
  unsigned long hour;
  unsigned long minute;
  unsigned long second;
  
  t -= ref;
  hour = t / (3600 * 1000UL);
  minute = t % (3600 * 1000UL);
  second = minute % (60 * 1000UL);
  minute -= second;
  if(topOfHourFlag) {
    Serial.print("Sync'd: ");
  }
  Serial.print(hour); Serial.print(":");
  Serial.print(minute/60000UL); Serial.print(":");
  Serial.print(second/1000.0,3);
}

float uptime() { // returns uptime as a floating point hour
  return (4294967296.0 * rollOvers + now) / (3600.0 * 1000);
}

float radioOnTime() { // returns time radio has been on in hours
  return (float) (totalRadioOn + (radioOn ? (now-lastRadioOn) : 0)) / (3600.0 * 1000);
}

void powerRadio(boolean power) {
  digitalWrite(radioPowerPin,power);
  radioOn = power;
  if(power) {
    lastRadioOn = now;
    lastRequest = requests;
  } else {
    totalRadioOn += (now-lastRadioOn);
    lastRadioOn = 0;
  }
  printTime(now,0); Serial.print(" "); printTime(now,topOfHour); Serial.print(" "); Serial.println(radioOn);
}
  
void analogSample() {
  for (int i = 0; i < num(analog); i++) {
    analog[i] = analogRead(i);
  }
}

byte data[12];
unsigned int id;
int ch = -1;

void tempSample() {
  finishTempSample();
  startTempSample();
}

void startTempSample() {
  if (ch < 0) {
    ds.reset_search();
  }
  if (!ds.search(data)) {
    ch = -1;
  } 
  else {
    if (OneWire::crc8(data, 7) == data[7] && 0x28 == data[0]) {
      id = data[2]*256u+data[1];
      ch = channel (id);
      ds.reset();
      ds.select(data);
      ds.write(0x44,1);         // start conversion, with parasite power on at the end
    } else {
      crc_errs++;
      Serial.print(id);
      Serial.println(F(" a-err"));
    }
  }
}

void finishTempSample() {
  if (ch >= 0) {                // if we've discovered a devise and started a conversion
    ds.reset();
    ds.select(data);
    ds.write(0xBE);             // Read Scratchpad
    for (int i = 0; i < 9; i++) {
      data[i] = ds.read();
    }
    if (OneWire::crc8(data, 8) == data[8]) {
      temp[ch].data = data[1]*256+data[0];
      temp[ch].code = id;      // don't set this too early or we could report bad data
    } else {
      crc_errs++;
      Serial.print(id);
      Serial.println(F(" d-err"));
    }
  }
}

int channel(int id) {
  for (int ch=0; ch<num(temp); ch++) {
    if (temp[ch].code == id || temp[ch].code == 0) {
      return ch;
    }
  }
  return 0;
}

// Accept Web Requests for Held Data

void serve() {
  client = server.available();
  if (client) {
    requests++;
    boolean blank = true;
    boolean slash = false;
    char code = 0;
    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        Serial.print(c);
        if (c == '\n' && blank) {
          report(code);
          break;
        }
        if (c == '\n') {
          blank = true;
        } 
        else if (c != '\r') {
          blank = false;
          if (slash && code == 0) {
            code = c;
          }
          slash = c == '/';
        }
      }
    }
    client.stop();
  }
}

// Respond to Web Requests in HTML and JSON

void report(char code) {
  if (code == ' ') {
    htmlReport();
  } else if (code == 'g') {
    jsonReport();
  } else if (code == 'f') {
    faviconReport();
  } else if (code == 's') {
    topOfHour = now = millis();
    topOfHourFlag = true;
  } else if (code == 'p') {
    now = millis();
    topOfHour = now - (4*60*1000UL);
    topOfHourFlag = true;
  } else if (code == '0') {
    radioPowerMode = 0;
  } else if (code == '1') {
    radioPowerMode = 1;
  } else if (code == '2') {
    radioPowerMode = 2;
  } else {
    errorReport();
  }
}

void p(char s) { client.print(s); }
void p(__FlashStringHelper* s) { client.print(s); }
void n(char s) { p(s); p(F("\r\n")); }
void n(__FlashStringHelper* s) { p(s); p(F("\r\n")); }
void a() { p(F("http://wiki.org/")); }

void code(__FlashStringHelper* s) { p(F("HTTP/1.1 ")); n(s);}
void mime(__FlashStringHelper* s) { p(F("Content-Type: ")); n(s); n(F("")); }
void link(__FlashStringHelper* s) { p(F("<link href='")); a(); p(s); n(F("' rel='stylesheet' type='text/css'>")); }
void scpt(__FlashStringHelper* s) { p(F("<script src='")); a(); p(s); n(F("' type='text/javascript'></script>")); }
void stag(__FlashStringHelper* s) { p('<'); p(s); p('>'); }
void etag(__FlashStringHelper* s) { p('<'); p('/'); p(s); p('>'); }

void htmlReport () {
  code(F("200 OK"));
  mime(F("text/html"));
  stag(F("html"));
    stag(F("head"));
      link(F("style.css"));
      scpt(F("js/jquery.min.js"));
      scpt(F("js/jquery-ui.custom.min.js"));
      scpt(F("client.js"));
    etag(F("head"));
    stag(F("body"));
      p(F("<div class='")); p(F("main")); n(F("'>"));
        p(F("<div class='")); p(F("page")); p(F("' id='")); p(F("garden-report")); p(F("'>"));
        etag(F("div")); 
      etag(F("div"));
    etag(F("body"));
  etag(F("html"));
}

boolean more;

void sh () { if (more) { p(','); } p('{'); more = false; }
void sa () { if (more) { p(','); } p('['); more = false; }
void eh () { p('}'); more = true; }
void ea () { p(']'); more = true; }
void k (__FlashStringHelper* s) {  if (more) { p(','); } p('"'); p(s); p('"'); p(':'); more = false; }
void v (__FlashStringHelper* s) {  if (more) { p(','); } p('"'); p(s); p('"'); more = true; }
void v (long  s) {  if (more) { p(','); } client.print(s); more = true; }
void v (int   s) {  if (more) { p(','); } client.print(s); more = true; }
void v (float s) {  if (more) { p(','); } client.print(s); more = true; }
  
void jsonReport () {
  more = false;
  long id = 472647400L;
  
  code(F("200 OK"));
  mime(F("application/json"));
  sh();
    k(F("title")); v(F("garden-report"));
    k(F("logo"));
      sh();
        k(F("nw")); sa(); v(127); v(255); v(127); ea();
        k(F("se")); sa(); v(63); v(63); v(16); ea();
      eh();
    k(F("story"));
      sa();
        sh();
          k(F("type")); v(F("paragraph"));
          k(F("id")); v(id++);
          k(F("text")); v(F("Experimental data from Nike's Community Garden. This content is being served on the open-source hardware Arduino platform running the [[smallest-federated-wiki]] server application."));
        eh();
        for (int ch=0; ch<num(temp); ch++) {
          if (temp[ch].code == 0) {break;}
          sh();
            k(F("type")); v(F("chart"));
            k(F("id")); v((long)temp[ch].code);
            k(F("caption")); v(F("Degrees Fahrenheit<br>Updated in Seconds"));
            k(F("data"));
              sa();
                sa(); v(1314306006L); v(temp[ch].data * (9.0F/5/16) + 32); ea();
              ea();
          eh();
        }
        for (int ch=0; ch<num(analog); ch++) {
          sh();
            k(F("type")); v(F("chart"));
            k(F("id")); v(201100L+ch);
            k(F("caption")); (ch == 1 ? v(F("Battery<br>Volts")) : ch == 2 ? v(F("Solar Panel<br>Volts")) : v(F("Daylight<br>Percent")));
            k(F("data"));
              sa();
                sa(); v(1314306006L); v(analog[ch] * (ch>=1 ? (1347.0F/89.45F/1024) : (100.0F/1024))); ea();
              ea();
          eh();
        }
        sh();
          k(F("type")); v(F("chart"));
          k(F("id")); v(id++);
          k(F("caption")); v(F("Wiki Server<br>Requests"));
          k(F("data"));
            sa();
              sa(); v(1314306006L); v((long)requests); ea();
            ea();
        eh();
        sh();
          k(F("type")); v(F("chart"));
          k(F("id")); v(id++);
          k(F("caption")); v(F("Arduino Uptime<br>Hours"));
          k(F("data"));
            sa();
              sa(); v(1314306006L); v(uptime()); ea();
            ea();
        eh();
        sh();
          k(F("type")); v(F("chart"));
          k(F("id")); v(id++);
          k(F("caption")); v(F("Radio Uptime<br>Hours"));
          k(F("data"));
            sa();
              sa(); v(1314306006L); v(radioOnTime()); ea();
            ea();
        eh();
        sh();
          k(F("type")); v(F("chart"));
          k(F("id")); v(id++);
          k(F("caption")); v(F("Minutes After Hour"));
          k(F("data"));
            sa();
              sa(); v(1314306006L); v((float) (topOfHourFlag ? ((now-topOfHour) % (3600*1000UL))/60000.0 : 0.0)); ea();
            ea();
        eh();
        sh();
          k(F("type")); v(F("chart"));
          k(F("id")); v(id++);
          k(F("caption")); v(F("Radio Power Mode"));
          k(F("data"));
            sa();
              sa(); v(1314306006L); v(radioPowerMode); ea();
            ea();
        eh();
      ea();
    k(F("journal"));
      sa();
      ea();
  eh();
  n(F(""));
}

void errorReport () {
  code(F("404 Not Found"));
  mime(F("text/html"));
  n(F("404 Not Found"));
}

void faviconReport () {
  code(F("200 OK"));
  mime(F("image/png"));
  client.print(F("\0211\0120\0116\0107\015\012\032\012\0\0\0\015\0111\0110\0104\0122\0\0\0\05\0\0\0\010\010\02\0\0\0\0276\0223\0242\0154\0\0\0\025\0111\0104\0101\0124\010\0231\0143\0374\0377\0277\0203\01\011\0260\074\0370\0372\0236\0236\0174\0\0366\0225\026\0\0105\030\0216\0134\0\0\0\0\0111\0105\0116\0104\0256\0102\0140\0202"));
}
