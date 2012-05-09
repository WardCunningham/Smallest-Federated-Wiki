require 'rubygems'
require 'png'

class Favicon
  class << self
    def create_blob
      canvas = PNG::Canvas.new 32, 32
      light = PNG::Color.from_hsv(256*rand,200,255).rgb()
      dark = PNG::Color.from_hsv(256*rand,200,125).rgb()
      angle = 2 * (rand()-0.5)
      sin = Math.sin angle
      cos = Math.cos angle
      scale = sin.abs + cos.abs
      for x in (0..31)
        for y in (0..31)
          p = (sin >= 0 ? sin*x+cos*y : -sin*(31-x)+cos*y) / 31 / scale
          canvas[x,y] = PNG::Color.new(
            light[0]*p + dark[0]*(1-p),
            light[1]*p + dark[1]*(1-p),
            light[2]*p + dark[2]*(1-p))
        end
      end
      PNG.new(canvas).to_blob
    end

    def get_or_create(path)
      Store.get_blob(path) || Store.put_blob(path, Favicon.create_blob)
    end

  end
end
