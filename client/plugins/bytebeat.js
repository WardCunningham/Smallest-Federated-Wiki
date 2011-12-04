(function() {
  var FMTSubChunk, RIFFChunk, audioCheck, b, c, chunkSize, colorCode, dataSubChunk, el, generateSound, makeSampleFunction, makeURL, play, playDataURI, sampleArrayToData, split32bitValueToBytes, stop;
  window.plugins.bytebeat = {
    emit: function(div, item) {
      div.append("<p>" + (colorCode(item.text)) + " <a href='#'>&#9654;</a><div id='player'></div></p>");
      return audioCheck();
    },
    bind: function(div, item) {
      div.find('a').click(function() {
        return play(item.text);
      });
      return div.dblclick(function() {
        stop();
        return wiki.textEditor(div, item);
      });
    }
  };
  colorCode = function(text) {
    return text.replace(/\bt((<<|>>)\d+)?\b/g, function(m) {
      return "<font color='red'>" + m + "</font>";
    }).replace(/\n/g, '<br>');
  };
  play = function(text) {
    return playDataURI(makeURL(text));
  };
  audioCheck = function() {
    var elm;
    elm = document.createElement("audio");
    if (!typeof elm.play) {
      throw "You don't seem to have a browser that supports audio.";
    }
  };
  makeSampleFunction = function(text) {
    var js;
    js = text.replace(/sin/g, "Math.sin").replace(/cos/g, "Math.cos").replace(/tan/g, "Math.tan").replace(/floor/g, "Math.floor").replace(/ceil/g, "Math.ceil");
    eval("var f = function (t) {return " + js + "}");
    return f;
  };
  generateSound = function(f) {
    var frequency, sample, sampleArray, seconds, t;
    frequency = 8000;
    seconds = 32.767;
    sampleArray = [];
    t = 0;
    while (t < frequency * seconds) {
      sample = (f(t)) & 0xff;
      sample *= 256;
      if (sample < 0) {
        sample = 0;
      }
      if (sample > 65535) {
        sample = 65535;
      }
      sampleArray.push(sample);
      t++;
    }
    return [frequency, sampleArray];
  };
  b = function(values) {
    var hex, i, out;
    out = "";
    i = 0;
    while (i < values.length) {
      hex = values[i].toString(16);
      if (hex.length === 1) {
        hex = "0" + hex;
      }
      out += "%" + hex;
      i++;
    }
    return out.toUpperCase();
  };
  c = function(str) {
    var i, out;
    if (str.length === 1) {
      return str.charCodeAt(0);
    } else {
      out = [];
      i = 0;
      while (i < str.length) {
        out.push(c(str[i]));
        i++;
      }
      return out;
    }
  };
  split32bitValueToBytes = function(l) {
    return [l & 0xff, (l & 0xff00) >> 8, (l & 0xff0000) >> 16, (l & 0xff000000) >> 24];
  };
  FMTSubChunk = function(channels, bitsPerSample, frequency) {
    var blockAlign, byteRate;
    byteRate = frequency * channels * bitsPerSample / 8;
    blockAlign = channels * bitsPerSample / 8;
    return [].concat(c("fmt "), split32bitValueToBytes(16), [1, 0], [channels, 0], split32bitValueToBytes(frequency), split32bitValueToBytes(byteRate), [blockAlign, 0], [bitsPerSample, 0]);
  };
  sampleArrayToData = function(sampleArray, bitsPerSample) {
    var data, i;
    if (bitsPerSample === 8) {
      return sampleArray;
    }
    if (bitsPerSample !== 16) {
      alert("Only 8 or 16 bit supported.");
      return;
    }
    data = [];
    i = 0;
    while (i < sampleArray.length) {
      data.push(0xff & sampleArray[i]);
      data.push((0xff00 & sampleArray[i]) >> 8);
      i++;
    }
    return data;
  };
  dataSubChunk = function(channels, bitsPerSample, sampleArray) {
    return [].concat(c("data"), split32bitValueToBytes(sampleArray.length * channels * bitsPerSample / 8), sampleArrayToData(sampleArray, bitsPerSample));
  };
  chunkSize = function(fmt, data) {
    return split32bitValueToBytes(4 + (8 + fmt.length) + (8 + data.length));
  };
  RIFFChunk = function(channels, bitsPerSample, frequency, sampleArray) {
    var data, fmt, header;
    fmt = FMTSubChunk(channels, bitsPerSample, frequency);
    data = dataSubChunk(channels, bitsPerSample, sampleArray);
    header = [].concat(c("RIFF"), chunkSize(fmt, data), c("WAVE"));
    return [].concat(header, fmt, data);
  };
  makeURL = function(text) {
    var bitsPerSample, channels, frequency, generated, samples;
    bitsPerSample = 16;
    generated = generateSound(makeSampleFunction(text));
    frequency = generated[0];
    samples = generated[1];
    channels = 1;
    return "data:audio/x-wav," + b(RIFFChunk(channels, bitsPerSample, frequency, samples));
  };
  el = void 0;
  stop = function() {
    if (el) {
      document.getElementById("player").removeChild(el);
    }
    return el = null;
  };
  playDataURI = function(uri) {
    stop();
    el = document.createElement("audio");
    el.setAttribute("autoplay", true);
    el.setAttribute("src", uri);
    el.setAttribute("controls", "controls");
    return document.getElementById("player").appendChild(el);
  };
}).call(this);
