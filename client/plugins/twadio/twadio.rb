class Twadio

  def initialize device_name, mix_freq, *argv
    mode = argv.shift
    frequency = argv.shift
    phase = argv.shift
    balance = argv.shift
    level = argv.shift
    sleep 3
	system "say mode #{mode}, frequency #{frequency}, phase #{phase}, balance #{balance}, level #{level}, transmit #{argv.shift}"
  end

end

Twadio.new 'Peaberry Radio|Peaberry SDR.*\(hw:1,0\)', 5000, *ARGV