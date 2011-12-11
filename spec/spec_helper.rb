USE_NODE = ENV['TEST_NODE'] == "true"

Bundler.require :test

unless USE_NODE
  require File.expand_path(File.join(File.dirname(__FILE__), "../server/sinatra/server"))

  raise 'Forget it.' if ENV['RACK_ENV'] == 'production'

  Capybara.server do |app, port|
    Thin::Logging.silent = true
    server = Thin::Server.new '0.0.0.0', port, app
    server.threaded = true
    server.start
    server
  end
  ENV['RACK_ENV'] = 'test'
end

