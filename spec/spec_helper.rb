ENV['RACK_ENV'] = 'test'

require File.expand_path(File.join(File.dirname(__FILE__), "../server/sinatra/server"))

raise 'Forget it.' if ENV['RACK_ENV'] == 'production'

Bundler.require :test

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