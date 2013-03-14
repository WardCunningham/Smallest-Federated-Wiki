# twadio.rb by David Turnbull AE9RB
#
# Example for connecting a Peaberry SDR with Smallest Federated Wiki.
# Presented at MicroHAMS 2013 conference by Ward Cunningham K9OX.
#
# Example install on Raspbian “wheezy”: 
#   sudo apt-get install ruby-dev portaudio19-dev
#   sudo gem install ffi-portaudio libusb --no-ri --no-rdoc
#   Create /etc/udev/rules.d/99-peaberry.rules containing the following:
#   SUBSYSTEM=="usb", ATTR{idVendor}=="16c0", ATTR{idProduct}=="05dc", MODE="0660", GROUP="dialout"
#
# Known issues:
#   Pulseaudio doesn't find all the devices the first time it loads.
#   Issue the command `pactl list` after a reboot to avoid problems.
#
# Transmit CW tone for I/Q balance or antenna tuning:
#   ruby twadio.rb tune FREQUENCY PHASE BALANCE LEVEL SECONDS
# Transmit PSK31:
#   ruby twadio.rb send FREQUENCY PHASE BALANCE LEVEL MESSAGE
#
# Frequency is in MHz with 1 Hz resolution. e.g. 14.072025
# Phase in degrees is neutral at 0.0 with a typical range of -20.0 to 20.0.
# Balance is neutral at 1.0 with a typical range of 0.5 to 1.5.
# Phase and balance may be obtained from HDSDR channel skew calibration for TX.
# Level is linear with max at 1.0 and mute at 0.0. Do not use levels higher
# than 0.5 to avoid clipping due to phase and balance adjustments.
# 
# -----------------------------------------------------------------------------
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so.
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
# IN THE SOFTWARE.
# -----------------------------------------------------------------------------

require 'complex'
require 'ffi-portaudio'
require 'libusb'

class Twadio
  include ::FFI::PortAudio

  def initialize device_name, mix_freq, *argv
    mode = (argv.shift||'').downcase
    unless argv.size > 4 and %w{tune send}.include? mode
      STDERR.puts "Usage: ruby twadio.rb tune|send FREQUENCY PHASE BALANCE LEVEL SECONDS|MESSAGE"
      exit 1
    end
    frequency = Float argv.shift
    phase = Math.tan Float(argv.shift) * Math::PI / 180
    balance = Float argv.shift
    level = Float argv.shift
    mix_freq = mix_freq.to_f
    mix_freq_mhz = mix_freq / 1000000
    rig = Rig.new
    rig.lo = frequency + mix_freq_mhz
    API.Pa_Initialize
    at_exit {API.Pa_Terminate}
    stream_pointer, rate = init_audio_device device_name
    STDOUT.puts "Signal: #{'%.6f' % (frequency)} MHz"
    STDOUT.puts "    LO: #{'%.6f' % (frequency + mix_freq_mhz)} MHz"
    STDOUT.puts " Image: #{'%.6f' % (frequency + (mix_freq_mhz * 2))} MHz"
    bitstream = eval(mode.capitalize).new argv
    signals = build_signals rate, mix_freq, phase, balance, level
    silence = signals[2]
    frames = silence.size / 8
    GC.start
    32.times {API.Pa_WriteStream stream_pointer, silence, frames}
    GC.disable
    rig.transmit = true
    loop do
      bit = bitstream.shift
      API.Pa_WriteStream stream_pointer, encode(signals, bit), frames
      break unless bit
    end
    10.times {API.Pa_WriteStream stream_pointer, silence, frames}
    rig.transmit = false
    GC.enable
    API.Pa_StopStream stream_pointer
    API.Pa_CloseStream stream_pointer
  end
  
  def init_audio_device device_name
    device_id = (0...API.Pa_GetDeviceCount).detect do |device_num|
      API.Pa_GetDeviceInfo(device_num)[:name].match device_name
    end
    unless device_id
      STDERR.puts "Found #{API.Pa_GetDeviceCount} audio devices:"
      (0...API.Pa_GetDeviceCount).each do |device_num|
        STDERR.print ' ', device_num, ': '
        STDERR.puts API.Pa_GetDeviceInfo(device_num)[:name]
      end
      raise "#{device_name.inspect} not found." 
    end
    stream = FFI::Buffer.new :pointer
    input = nil
    output = API::PaStreamParameters.new
    output[:device] = device_id
    output[:suggestedLatency] = API.Pa_GetDeviceInfo(device_id)[:defaultHighOutputLatency]
    output[:hostApiSpecificStreamInfo] = nil
    output[:channelCount] = 2
    output[:sampleFormat] = API::Float32
    rate = API.Pa_GetDeviceInfo(device_id)[:defaultSampleRate]
    rate = 48000.0 unless rate == 96000.0
    frames = 1536
    flags = API::NoFlag
    callback = nil
    userdata = nil
    result = API.Pa_OpenStream stream, input, output, rate, frames, flags, callback, userdata
    raise "Pa_OpenStream returned #{result.inspect}" unless result == :paNoError
    stream_pointer = stream.read_pointer
    result = API.Pa_StartStream stream_pointer
    raise "Pa_StartStream returned #{result.inspect}" unless result == :paNoError
    [stream_pointer, rate]
  end  
  
  def build_signals rate, mix_freq, phase, balance, level
    size = (rate / 31.25).to_i
    signal_inc = Math.exp(Complex(0.0, Math::PI * 2 * (mix_freq/rate)))
    shape_inc = Math.exp(Complex(0.0, Math::PI * (31.25/rate)))
    signals = [[[nil,nil],[nil,nil]],[[nil,nil],[nil,nil]],nil]
    signals[2] = FFI::MemoryPointer.new size * 8
    signals[2].write_array_of_float((size*2).times.collect {0.0})
    (0..1).each do |pre|
      (0..1).each do |cur|
        (0..1).each do |post|
          if cur == 0
            signal = Complex(1.0,0.0)
          else
            signal = Complex(-1.0,0.0)
          end
          shape = Complex(0.0,-1.0)
          mem = FFI::MemoryPointer.new size * 8
          mem.write_array_of_float(size.times.collect do
            signal *= signal_inc
            shape *= shape_inc
            if (shape.imag < 0 and pre == cur) or (shape.imag > 0 and cur == post)
              gain = level
            else
              gain = level * shape.real
            end
            [gain * (signal.real + phase * signal.imag), gain * (signal.imag * balance)]
          end.flatten)
          signals[pre][cur][post] = mem
        end
      end
    end
    signals
  end
    
  def encode signals, bit
    @z ||= [0,1,0]
    @z[0] = @z[1]
    @z[1] = @z[2]
    if bit == 1
      @z[2] = @z[1]
    else
      @z[2] = (@z[1] + 1) & 1
    end
    signals[@z[0]][@z[1]][@z[2]]
  end
  
end

class Twadio::Rig

  RT_OUT = LIBUSB::REQUEST_TYPE_VENDOR | LIBUSB::RECIPIENT_DEVICE | LIBUSB::ENDPOINT_OUT
  RT_IN = LIBUSB::REQUEST_TYPE_VENDOR | LIBUSB::RECIPIENT_DEVICE | LIBUSB::ENDPOINT_IN

  def initialize
    options = {idVendor: 0x16c0, idProduct: 0x05dc}
    index = 0
    unless @device = LIBUSB::Context.new.devices(options)[index]
      raise 'Si570 USB control interface not found'
    end
    at_exit {self.transmit = false}
  end
  
  def lo= frequency
    data = [frequency * (1<<21) * 4].pack('L')
    @device.open do |handle|
      handle.claim_interface 0
      handle.control_transfer(
        bmRequestType: RT_OUT, bRequest: 0x32, 
        wValue: 0, wIndex: 0, dataOut: data
      )
      handle.release_interface 0
    end
  end
  
  def transmit= status
    status = status ? 0x01 : 0x00
    @device.open do |handle|
      handle.claim_interface 0
      handle.control_transfer(
        bmRequestType: RT_IN, bRequest: 0x50, 
        wValue: status, wIndex: 0, dataIn: 1
      )
      handle.release_interface 0
    end
  end

end

class Twadio::Tune
  
  def initialize argv
    seconds = Float argv.shift
    @count = (31.25 * seconds).to_i
  end
  
  def shift
    @count -= 1
    return nil if @count < 0
    1
  end

end


class Twadio::Send
  
  AMBLE = 32
  VARICODE = [
    0xAAC0, 0xB6C0, 0xBB40, 0xDDC0, 0xBAC0, 0xD7C0, 0xBBC0, 0xBF40, 0xBFC0, 0xEF00, 0xE800, 0xDBC0, 0xB740, 0xF800, 0xDD40, 0xEAC0,
    0xBDC0, 0xBD40, 0xEB40, 0xEBC0, 0xD6C0, 0xDAC0, 0xDB40, 0xD5C0, 0xDEC0, 0xDF40, 0xEDC0, 0xD540, 0xD740, 0xEEC0, 0xBEC0, 0xDFC0,
    0x8000, 0xFF80, 0xAF80, 0xFA80, 0xED80, 0xB540, 0xAEC0, 0xBF80, 0xFB00, 0xF700, 0xB780, 0xEF80, 0xEA00, 0xD400, 0xAE00, 0xD780,
    0xB700, 0xBD00, 0xED00, 0xFF00, 0xBB80, 0xAD80, 0xB580, 0xD680, 0xD580, 0xDB80, 0xF500, 0xDE80, 0xF680, 0xAA00, 0xEB80, 0xABC0,
    0xAF40, 0xFA00, 0xEB00, 0xAD00, 0xB500, 0xEE00, 0xDB00, 0xFD00, 0xAA80, 0xFE00, 0xFE80, 0xBE80, 0xD700, 0xBB00, 0xDD00, 0xAB00,
    0xD500, 0xEE80, 0xAF00, 0xDE00, 0xDA00, 0xAB80, 0xDA80, 0xAE80, 0xBA80, 0xBD80, 0xAB40, 0xFB80, 0xF780, 0xFD80, 0xAFC0, 0xB680,
    0xB7C0, 0xB000, 0xBE00, 0xBC00, 0xB400, 0xC000, 0xF400, 0xB600, 0xAC00, 0xD000, 0xF580, 0xBF00, 0xD800, 0xEC00, 0xF000, 0xE000,
    0xFC00, 0xDF80, 0xA800, 0xB800, 0xA000, 0xDC00, 0xF600, 0xD600, 0xDF00, 0xBA00, 0xEA80, 0xADC0, 0xDD80, 0xAD40, 0xB5C0, 0xED40,
    0xEF40, 0xEFC0, 0xF540, 0xF5C0, 0xF6C0, 0xF740, 0xF7C0, 0xFAC0, 0xFB40, 0xFBC0, 0xFD40, 0xFDC0, 0xFEC0, 0xFF40, 0xFFC0, 0xAAA0,
    0xAAE0, 0xAB60, 0xABA0, 0xABE0, 0xAD60, 0xADA0, 0xADE0, 0xAEA0, 0xAEE0, 0xAF60, 0xAFA0, 0xAFE0, 0xB560, 0xB5A0, 0xB5E0, 0xB6A0,
    0xB6E0, 0xB760, 0xB7A0, 0xB7E0, 0xBAA0, 0xBAE0, 0xBB60, 0xBBA0, 0xBBE0, 0xBD60, 0xBDA0, 0xBDE0, 0xBEA0, 0xBEE0, 0xBF60, 0xBFA0,
    0xBFE0, 0xD560, 0xD5A0, 0xD5E0, 0xD6A0, 0xD6E0, 0xD760, 0xD7A0, 0xD7E0, 0xDAA0, 0xDAE0, 0xDB60, 0xDBA0, 0xDBE0, 0xDD60, 0xDDA0,
    0xDDE0, 0xDEA0, 0xDEE0, 0xDF60, 0xDFA0, 0xDFE0, 0xEAA0, 0xEAE0, 0xEB60, 0xEBA0, 0xEBE0, 0xED60, 0xEDA0, 0xEDE0, 0xEEA0, 0xEEE0,
    0xEF60, 0xEFA0, 0xEFE0, 0xF560, 0xF5A0, 0xF5E0, 0xF6A0, 0xF6E0, 0xF760, 0xF7A0, 0xF7E0, 0xFAA0, 0xFAE0, 0xFB60, 0xFBA0, 0xFBE0,
    0xFD60, 0xFDA0, 0xFDE0, 0xFEA0, 0xFEE0, 0xFF60, 0xFFA0, 0xFFE0, 0xAAB0, 0xAAD0, 0xAAF0, 0xAB50, 0xAB70, 0xABB0, 0xABD0, 0xABF0,
    0xAD50, 0xAD70, 0xADB0, 0xADD0, 0xADF0, 0xAEB0, 0xAED0, 0xAEF0, 0xAF50, 0xAF70, 0xAFB0, 0xAFD0, 0xAFF0, 0xB550, 0xB570, 0xB5B0
  ].freeze
  
  def initialize argv
    @message = argv.join(' ').force_encoding('binary')
    @char = nil
    @pos = 0
    @amble = AMBLE
  end
  
  def shift
    if @amble > 0
      @amble -= 1
      return 0
    end
    if @amble < 0
      @amble += 1
      return nil if @amble == 0
      return 1
    end
    unless @char
      c = @message[@pos]
      @pos += 1
      if c
        @char = VARICODE[c.ord]
      else
        @amble = -AMBLE
      end
      return 0
    end
    ret = (@char & 0x8000 == 0) ? 0 : 1
    if @char == 0
      @char = nil
    else
      @char = @char << 1 & 0xFFFF
    end
    ret
  end

end

Twadio.new 'Peaberry Radio|Peaberry SDR.*\(hw:1,0\)', 5000, *ARGV
