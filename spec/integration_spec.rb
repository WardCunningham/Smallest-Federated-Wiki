require File.dirname(__FILE__) + '/spec_helper'
require 'capybara/rspec'

require 'capybara/dsl'
require 'pathname'
require 'digest/sha1'
require 'net/http'

module TestDirs
  ROOT = File.expand_path(File.join(File.dirname(__FILE__), ".."))
  APP_DATA_DIR = File.join(ROOT, "data")
  TEST_DATA_DIR = File.join(ROOT, 'spec/data')
  FIXTURE_DATA_DIR = File.join(ROOT, 'spec/fixtures/data')
  JS_DIR = File.join(ROOT, "spec/js")
end


if USE_NODE
  Capybara.app_host = "http://localhost:33333"
else
  class TestApp < Controller
    def self.data_root
      TestDirs::TEST_DATA_DIR
    end
  end
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
    Capybara.current_driver = :selenium
  end
end

describe "loading a page" do

  it "should load the welcome page" do
    visit("/")
    body.should include("Welcome Visitors")
  end

  it "should copy welcome-visitors from the default-data to data" do
    File.exist?(File.join(TestDirs::TEST_DATA_DIR, "pages/welcome-visitors")).should == false
    visit("/")
    body.should include("Welcome Visitors")
    File.exist?(File.join(TestDirs::TEST_DATA_DIR, "pages/welcome-visitors")).should == true
  end

  it "should load multiple pages at once" do
    visit("/view/welcome-visitors/view/indie-web-camp")
    body.should include("You are welcome to copy this page to any server you own and revise its welcoming message as you see fit.")
    body.should include("Rather than posting content on many third-party silos of data, we should all begin owning the data we're creating. ")
  end

  it "should load remote page" do
    remote = "localhost:#{Capybara.server_port}"
    visit("/#{remote}/welcome-visitors")
    body.should include("You are welcome to copy this page to any server you own and revise its welcoming message as you see fit.")
  end

end

class Capybara::Node::Element
  def double_click
    driver.browser.mouse.double_click(native)
  end

  TRIGGER_JS = "$(arguments[0]).trigger(arguments[1]);"
  def trigger(event)
    driver.browser.execute_script(TRIGGER_JS, native, event)
  end

  def drag_down(number)
    driver.resynchronize do
      driver.browser.execute_script "$(arguments[0]).simulateDragSortable({move: arguments[1]});", native, number
    end
  end

  def roll_over
    trigger "mouseover"
  end

  def roll_out
    trigger "mouseout"
  end
end

class Capybara::Session
  def back
    execute_script("window.history.back()")
  end

  def load_test_library!
    Dir["#{TestDirs::JS_DIR}/*.js"].each do |file|
      driver.browser.execute_script File.read(file)
    end
  end

  AJAX_TIMEOUT_LIMIT = 5
  def wait_for_ajax_to_complete!
    start = Time.now
    while evaluate_script("window.jQuery.active") != 0 do
      raise Timeout::Error.new("AJAX request timed out") if Time.now - start > AJAX_TIMEOUT_LIMIT
    end
  end

  def visit_with_wait_for_ajax(*args)
    visit_without_wait_for_ajax(*args)
    wait_for_ajax_to_complete!
  end
  alias_method :visit_without_wait_for_ajax, :visit
  alias_method :visit, :visit_with_wait_for_ajax
end

def pause
  STDIN.read(1)
end

module IntegrationHelpers
  def journal
    page.find(".journal").all(".action")
  end

  def first_paragraph
    page.find(".paragraph:first")
  end

end

describe "edit paragraph in place" do
  before do
    visit("/")
  end
  include IntegrationHelpers


  def double_click_paragraph
    first_paragraph.double_click
  end

  def text_area
    first_paragraph.find("textarea")
  end

  def replace_and_save(value)
    text_area.set value
    text_area.trigger "focusout"
  end

  it "should turn into a text area, showing wikitext when double-clicking" do
    double_click_paragraph
    text_area.value.should include("Welcome to the [[Smallest Federated Wiki]]")
  end

  it "should save changes to wiki text when unfocused" do
    double_click_paragraph
    replace_and_save("The [[quick brown]] fox.")
    first_paragraph.text.should include("The quick brown fox")
  end

  it "should record edit in the journal" do
    j = journal.length
    double_click_paragraph
    replace_and_save("The [[quick brown]] fox.")
    journal.length.should == j+1
  end
end

def use_fixture_pages(*pages)
  `rm -rf #{TestDirs::TEST_DATA_DIR}`
  pages.each do |page|
    FileUtils.mkdir_p "#{TestDirs::TEST_DATA_DIR}/pages/"
    FileUtils.cp "#{TestDirs::FIXTURE_DATA_DIR}/pages/#{page}", "#{TestDirs::TEST_DATA_DIR}/pages/#{page}"
  end
end

describe "completely empty (but valid json) page" do
  before do
    use_fixture_pages("empty-page")
    visit("/view/empty-page")
  end

  it "should have a title of empty" do
    body.should include("</a> empty</h1>")
  end

  it "should have an empty story" do
    body.should include("<div class=\"story ui-sortable\"></div>")
  end

  it "should have an empty journal" do
    body.should include("<div class=\"journal\"></div>")
  end
end


describe "moving paragraphs" do
  before do
    use_fixture_pages("multiple-paragraphs")
  end

  include IntegrationHelpers

  def move_paragraph
    page.load_test_library!
    first_paragraph.drag_down(2)
  end

  def journal_items
    page.all(".journal a")
  end

  before do
    visit "/view/multiple-paragraphs"
  end

  it "should move paragraph 1 past paragraph 2" do
    move_paragraph
    page.all(".paragraph").map(&:text).should == ["paragraph 2", "paragraph 1", "paragraph 3"]
  end

  it "should add a move to the journal" do
    original_journal_length = journal_items.length
    move_paragraph
    journal_items.length.should == original_journal_length + 1
    journal_items.last.text.should == "m"
  end


end

describe "navigating between pages" do
  before do
    visit("/")
  end

  def link_titled(text)
    page.all("a").select {|l| l.text == text}.first
  end

  it "should open internal links by adding a new wiki page to the web page" do
    link_titled("Indie Web Camp").click
    page.all(".page").length.should == 2
  end

  it "should remove added pages when the browser's back button is pressed" do
    link_titled("Indie Web Camp").click
    page.back
    page.all(".page").length.should == 1
  end
end

# This should probably be moved somewhere else.
describe "should retrieve favicon" do

  def default_favicon
    File.join(APP_ROOT, "default-data/status/favicon.png")
  end

  def local_favicon
    File.join(TestDirs::TEST_DATA_DIR, "status/favicon.png")
  end

  def favicon_response
    Net::HTTP.get_response URI.parse(page.driver.rack_server.url("/favicon.png"))
  end

  def sha(text)
    Digest::SHA1.hexdigest(text)
  end

  it "should create an image when no other image is present" do
    File.exist?(local_favicon).should == false
    sha(favicon_response.body).should == sha(File.read(local_favicon))
    favicon_response['Content-Type'].should == 'image/png'
  end

  it "should return the local image when it exists" do
    FileUtils.mkdir_p File.dirname(local_favicon)
    FileUtils.cp "#{TestDirs::ROOT}/spec/favicon.png", local_favicon
    sha(favicon_response.body).should == sha(File.read(local_favicon))
    favicon_response['Content-Type'].should == 'image/png'
  end

end

describe "viewing journal" do
  before do
    use_fixture_pages("multiple-paragraphs", "duplicate-paragraphs")
  end
  include IntegrationHelpers

  RSpec::Matchers.define :be_highlighted do
    match do |actual|
      actual['class'].include?("target")
    end
  end

  it "should highlight a paragraph when hovering over journal entry" do
    visit "/view/multiple-paragraphs"
    paragraphs = page.all(".paragraph")
    first_paragraph = paragraphs.first
    other_paragraphs = paragraphs - [first_paragraph]

    paragraphs.each {|p| p.should_not be_highlighted }

    journal.first.roll_over
    first_paragraph.should be_highlighted
    other_paragraphs.each {|p| p.should_not be_highlighted }

    journal.first.roll_out
    paragraphs.each {|p| p.should_not be_highlighted }
  end

  it "should highlight all paragraphs with all the same JSON id" do
    visit "/view/duplicate-paragraphs"
    first_paragraph, second_paragraph = page.all(".paragraph")

    journal.first.roll_over
    first_paragraph.should be_highlighted
    second_paragraph.should be_highlighted
  end
end
