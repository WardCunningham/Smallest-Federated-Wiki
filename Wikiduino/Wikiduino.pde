// Copyright (c) 2011, Ward Cunningham
// Released under MIT and GPLv2

#include <SPI.h>
#include <Ethernet.h>
#include <OneWire.h>
#define num(array) (sizeof(array)/sizeof(array[0]))

// Ethernet Configuration

byte mac[] = { 0xEE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED   };
//byte ip[] = { 10, 94, 54, 2   };
//byte gateway[] = { 10, 94, 54, 1 };
byte ip[] = { 10, 0, 3, 201   };
byte gateway[] = { 10, 0, 3, 1 };
byte subnet[] = { 255, 255, 255, 0 };

Server server(80);
Client client(255);

unsigned long requests = 0;

// Sensor Configuration

OneWire ds(8);

int analog[2];
struct Temp {
  unsigned int code; 
  int data;
} temp[4] = {{0,0}};

unsigned int last = 100;
unsigned long crc_errs = 0;

// Arduino Setup and Loop

void setup() {
  Serial.begin(115200L);
  Ethernet.begin(mac, ip, gateway, subnet);
  server.begin();
}

void loop() {
  sample();    // every second or so
  pinMode(4,OUTPUT);
  digitalWrite(4,HIGH);
  serve();     // whenever web requests come in
  digitalWrite(4,LOW);
}

// Sample and Hold Analog and One-Wire Temperature Data

void sample() {
  unsigned int now = millis();
  if ((now-last) >= 1000) {
    last = now;
    analogSample();
    tempSample();
  }
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
      Serial.println(" a-err");
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
      Serial.println(" d-err");
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
  } else {
    errorReport();
  }
}

void p(char s) { client.print(s); }
void p(char *s) { client.print(s); }
void n(char s) { p(s); p("\r\n"); }
void n(char *s) { p(s); p("\r\n"); }
void a() { p("http://wiki.org/"); }

void code(char *s) { p("HTTP/1.1 "); n(s);}
void mime(char *s) { p("Content-Type: "); n(s); n(""); }
void link(char *s) { p("<link href='"); a(); p(s); n("' rel='stylesheet' type='text/css'>"); }
void scpt(char *s) { p("<script src='"); a(); p(s); n("' type='text/javascript'></script>"); }
void stag(char *s) { p('<'); p(s); p('>'); }
void etag(char *s) { p('<'); p('/'); p(s); p('>'); }

void htmlReport () {
  code("200 OK");
  mime("text/html");
  stag("html");
    stag("head");
      link("style.css");
      scpt("js/jquery.min.js");
      scpt("js/jquery-ui.custom.min.js");
      scpt("client.js");
    etag("head");
    stag("body");
      p("<div class='"); p("main"); n("'>");
        p("<div class='"); p("page"); p("' id='"); p("garden-report"); p("'>");
        etag("div"); 
      etag("div");
    etag("body");
  etag("html");
}

boolean more;

void sh () { if (more) { p(','); } p('{'); more = false; }
void sa () { if (more) { p(','); } p('['); more = false; }
void eh () { p('}'); more = true; }
void ea () { p(']'); more = true; }
void k (char* s) {  if (more) { p(','); } p('"'); p(s); p('"'); p(':'); more = false; }
void v (char* s) {  if (more) { p(','); } p('"'); p(s); p('"'); more = true; }
void v (long  s) {  if (more) { p(','); } client.print(s); more = true; }
void v (float s) {  if (more) { p(','); } client.print(s); more = true; }
  
void jsonReport () {
  more = false;
  long id = 472647400L;
  
  code("200 OK");
  mime("application/json");
  sh();
    k("title"); v("garden-report");
    k("story");
      sa();
        sh();
          k("type"); v("paragraph");
          k("id"); v(id++);
          k("text"); v("Experimental data from Nike's Community Garden.");
        eh();
        for (int ch=0; ch<num(temp); ch++) {
          if (temp[ch].code == 0) {break;}
          sh();
            k("type"); v("chart");
            k("id"); v((long)temp[ch].code);
            k("caption"); v("Fahrenheit");
            k("data");
              sa();
                sa(); v(1314306006L); v(temp[ch].data * (9.0F/5/16) + 32); ea();
              ea();
          eh();
        }
        for (int ch=0; ch<num(analog); ch++) {
          sh();
            k("type"); v("chart");
            k("id"); v(201100L+ch);
            k("caption"); v("Percent");
            k("data");
              sa();
                sa(); v(1314306006L); v(analog[ch] * (100.0F/1024)); ea();
              ea();
          eh();
        }
        sh();
          k("type"); v("chart");
          k("id"); v(id++);
          k("caption"); v("Requests");
          k("data");
            sa();
              sa(); v(1314306006L); v((long)requests); ea();
            ea();
        eh();
      ea();
    k("journal");
      sa();
      ea();
  eh();
}

void errorReport () {
  code("404 Not Found");
  mime("text/html");
  n("404 Not Found");
}

