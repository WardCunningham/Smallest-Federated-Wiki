require File.dirname(__FILE__) + '/spec_helper'
require 'capybara/rspec'

require 'capybara/dsl'
require 'pathname'

ROOT = File.expand_path(File.join(File.dirname(__FILE__), ".."))
APP_DATA_DIR = File.join(ROOT, "data")
TEST_DATA_DIR = File.join(ROOT, 'spec/data')

class TestApp < Controller
  def self.data_root
    TEST_DATA_DIR
  end
end

# Capybara.register_driver :selenium do |app|
#   Capybara::Selenium::Driver.new(app, :resynchronize => true)
# end

Capybara.app = TestApp

RSpec.configure do |config|
  config.include Capybara::DSL
end

describe "loading a page" do
  before do
    `rm -rf #{TEST_DATA_DIR}`
    Capybara.current_driver = :selenium
  end

  it "should load the welcome page" do
    visit("/")
    body.should include("Welcome Visitors")
  end

  it "should copy welcome-visitors from the default-data to data" do
    File.exist?(File.join(TEST_DATA_DIR, "pages/welcome-visitors")).should == false
    visit("/")
    body.should include("Welcome Visitors")
    File.exist?(File.join(TEST_DATA_DIR, "pages/welcome-visitors")).should == true
  end

end