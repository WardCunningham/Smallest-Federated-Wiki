require File.join(File.expand_path(File.dirname(__FILE__)), 'server/server.rb')

map '/' do
  run Controller
end
