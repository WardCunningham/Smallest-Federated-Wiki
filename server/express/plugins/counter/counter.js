#!/usr/bin/env node

var i = 0;

function callback() {
  i++;
  console.log(i);
}

setInterval(callback, 1000);
