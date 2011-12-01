ENV['RACK_ENV'] = 'test'
require File.join(File.expand_path(File.dirname(__FILE__)), '../', 'server/server.rb')

raise 'Forget it.' if ENV['RACK_ENV'] == 'production'

Bundler.require :test

def mock_app(base=Sinatra::Base, &block)
  @app = Sinatra.new(base, &block)
end

def app=(new_app)
  @app = new_app
end

Capybara.server do |app, port|
  Thin::Logging.silent = true
  server = Thin::Server.new '0.0.0.0', port, app
  server.threaded = true
  server.start
  server
end