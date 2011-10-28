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

Capybara.app = TestApp
Capybara.current_driver = :selenium

RSpec.configure do |config|
  config.include Capybara::DSL
end

describe "loading a page" do
  before do
    TestApp.setup_default_files
    `rm -rf #{TEST_DATA_DIR}`

    defaults = `find #{APP_DATA_DIR} -name 'default*'`.split("\n")
    defaults.each do |file|
      relative = Pathname.new(file).relative_path_from(Pathname.new(APP_DATA_DIR))
      new_file_name = File.join(TEST_DATA_DIR, relative)
      FileUtils.mkdir_p File.dirname(new_file_name)
      FileUtils.cp file, new_file_name
    end
  end

  it "should set up default files" do
    File.exist?("#{TEST_DATA_DIR}/pages/welcome-visitors").should == false
    TestApp.setup_default_files
    File.exist?("#{TEST_DATA_DIR}/pages/welcome-visitors").should == true
  end

  describe "with pages loaded" do
    before do
      TestApp.setup_default_files
    end

    it "should load the welcome page, and copy default-welcome-visitors to welcome-visitors" do
      visit("/")
      body.should include("Welcome Visitors")
    end
  end

end