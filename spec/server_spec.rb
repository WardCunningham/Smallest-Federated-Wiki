require File.dirname(__FILE__) + '/spec_helper'
require 'rexml/document'
require 'pp'
require 'json'
include Rack::Test::Methods
def app; Controller; end

shared_examples_for "Welcome as HTML" do
  it "renders the page" do
    last_response.status.should == 200
  end

  it "has a section with class 'main'" do
    @body.should match(/<section class='main'>/)
  end

  it "has a div with class 'page' and id 'welcome-visitors'" do
    @body.should match(/<div class='page' id='welcome-visitors'>/)
  end
end

describe "GET /" do
  before(:all) do
    get "/"
    @response = last_response
    @body = last_response.body
  end

  it_behaves_like 'Welcome as HTML'
end

describe "GET /welcome-visitors.html" do
  before(:all) do
    get "/welcome-visitors.html"
    @response = last_response
    @body = last_response.body
  end

  it_behaves_like 'Welcome as HTML'
end

describe "GET /view/welcome-visitors" do
  before(:all) do
    get "/view/welcome-visitors"
    @response = last_response
    @body = last_response.body
  end

  it_behaves_like 'Welcome as HTML'
end

describe "GET /view/welcome-visitors/view/indie-web-camp" do
  before(:all) do
    get "/view/welcome-visitors/view/indie-web-camp"
    @response = last_response
    @body = last_response.body
  end

  it_behaves_like 'Welcome as HTML'

  it "has a div with class 'page' and id 'indie-web-camp'" do
    @body.should match(/<div class='page' id='indie-web-camp'>/)
  end
end

describe "GET /welcome-visitors.json" do
  before(:all) do
    get "/welcome-visitors.json"
    @response = last_response
    @body = last_response.body
  end

  it "returns 200" do
    last_response.status.should == 200
  end
  
  it "returns Content-Type application/json" do
    last_response.header["Content-Type"].should == "application/json"
  end

  it "returns valid JSON" do
    expect {
      JSON.parse(@body)
    }.should_not raise_error
  end

  context "JSON from GET /welcome-visitors.json" do
    before(:all) do
      @json = JSON.parse(@body)
    end

    it "has a title string" do
      @json['title'].class.should == String
    end

    it "has a story arry" do
      @json['story'].class.should == Array
    end

    it "has paragraph as first item in story" do
      @json['story'].first['type'].should == 'paragraph'
    end

    it "has paragraph with text string" do
      @json['story'].first['text'].class.should == String
    end
  end
end

describe "GET /non-existent-test-page" do
  before(:all) do
    `rm data/pages/non-existent-test-page`
  end

  after(:all) do
    `rm data/pages/non-existent-test-page`
  end

  before(:each) do
    get "/non-existent-test-page.json"
    @response = last_response
    @body = last_response.body
    @json = JSON.parse(@body)
  end

  it "has a factory item" do
    @json['story'].first['type'].should == 'factory'
  end

  it "can convert factory to paragraph" do
    factory = @json['story'].first
    factory['type'] = 'paragraph'
    factory['text'] = 'The quick brown fox jumped over the lazy dogs back.'
    action = {'id'=>factory['id'], 'type'=>'edit', 'item'=>factory }
    put "/page/non-existent-test-page/action", :action => action.to_json
    last_response.body.should == 'ok'
  end

  it "has the revision in the story" do
    @json['story'].first['text'].should == 'The quick brown fox jumped over the lazy dogs back.'
  end

  it "has an edit action in the journal" do
    @json['journal'].first['type'].should == 'edit'
  end
end
