require 'capybara/rspec'
require 'capybara/dsl'
require 'rack/test'

USE_NODE = ENV['TEST_NODE'] == "true"

Bundler.require :test

module TestDirs
  ROOT = File.expand_path(File.join(File.dirname(__FILE__), ".."))
  APP_DATA_DIR = File.join(ROOT, "data")
  TEST_DATA_DIR = File.join(ROOT, 'spec/data')
  FIXTURE_DATA_DIR = File.join(ROOT, 'spec/fixtures/data')
  JS_DIR = File.join(ROOT, "spec/js")
end

if USE_NODE
  Capybara.app_host = "http://localhost:33333"
  Capybara.server_port = 33333
else
  require File.expand_path(File.join(File.dirname(__FILE__), "../server/sinatra/server"))

  raise 'Forget it.' if ENV['RACK_ENV'] == 'production'

  class TestApp < Controller
    def self.data_root
      TestDirs::TEST_DATA_DIR
    end
  end

  Capybara.server do |app, port|
    Thin::Logging.silent = true
    server = Thin::Server.new '0.0.0.0', port, app
    server.threaded = true
    server.start
    server
  end
  ENV['RACK_ENV'] = 'test'

  Capybara.app = TestApp
  Capybara.server_port = 31337

end


Capybara.register_driver :selenium do |app|
  Capybara::Selenium::Driver.new(app, :resynchronize => true)
end

RSpec.configure do |config|
  config.include Capybara::DSL

  config.before(:each) do
    `rm -rf #{TestDirs::TEST_DATA_DIR}`
    FileUtils.mkdir_p TestDirs::TEST_DATA_DIR
    Capybara.current_driver = :selenium
  end

  module RackTestOurApp
    include Rack::Test::Methods
    def app; TestApp; end
  end
  config.include(RackTestOurApp)
end

