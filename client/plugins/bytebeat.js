(function() {
  var FMTSubChunk, RIFFChunk, audioCheck, b, c, chunkSize, colorCode, dataSubChunk, frequency, generateSound, makeSampleFunction, makeURL, sampleArrayToData, split32bitValueToBytes;

  window.plugins.bytebeat = {
    emit: function(div, item) {
      div.append("<p>" + (colorCode(item.text)) + " <a href='#' class='play'>&#9654;</a></div></p>");
      return audioCheck();
    },
    bind: function(div, item) {
      var _this = this;
      div.find('a').click(function() {
        return _this.play(div, item);
      });
      return div.dblclick(function() {
        _this.stop(div);
        return wiki.textEditor(div, item);
      });
    },
    play: function(div, item) {
      this.stop(div);
      return $("<audio>").attr({
        autoplay: true,
        src: makeURL(item.text),
        controls: "controls"
      }).appendTo(div);
    },
    stop: function(div) {
      return this.audio(div).remove();
    },
    audio: function(div) {
      return div.find("audio");
    }
  };

  colorCode = function(text) {
    return text.replace(/\bt((<<|>>)\d+)?\b/g, function(m) {
      return "<span class='symbol'>" + m + "</span>";
    }).replace(/\n/g, '<br>');
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

  frequency = 8000;

  generateSound = function(f) {
    var samples, seconds, t, _results;
    seconds = 32.767;
    samples = frequency * seconds;
    t = 0;
    _results = [];
    while (t < samples) {
      _results.push(((f(t++)) & 0xff) * 256);
    }
    return _results;
  };

  b = function(values) {
    var num, strings;
    strings = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = values.length; _i < _len; _i++) {
        num = values[_i];
        _results.push((num > 15 ? "%" : "%0") + num.toString(16));
      }
      return _results;
    })();
    return strings.join('').toUpperCase();
  };

  c = function(str) {
    var code, _i, _len, _results;
    if (str.length === 1) {
      return str.charCodeAt(0);
    } else {
      _results = [];
      for (_i = 0, _len = str.length; _i < _len; _i++) {
        code = str[_i];
        _results.push(c(code));
      }
      return _results;
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
    var data, samp, _i, _len;
    if (bitsPerSample === 8) return sampleArray;
    if (bitsPerSample !== 16) throw "Only 8 or 16 bit supported.";
    data = [];
    for (_i = 0, _len = sampleArray.length; _i < _len; _i++) {
      samp = sampleArray[_i];
      data.push(0xff & samp);
      data.push((0xff00 & samp) >> 8);
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
    var bitsPerSample, channels, samples;
    bitsPerSample = 16;
    samples = generateSound(makeSampleFunction(text));
    channels = 1;
    return "data:audio/x-wav," + b(RIFFChunk(channels, bitsPerSample, frequency, samples));
  };

}).call(this);
