require File.join(File.expand_path(File.dirname(__FILE__)), 'server')

map '/' do
  run Controller
end
