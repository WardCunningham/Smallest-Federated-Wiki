require File.dirname(__FILE__) + '/spec_helper'
require 'rexml/document'
require 'pp'
include Rack::Test::Methods
def app; Controller; end

shared_examples_for "Welcome" do
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

  it_behaves_like 'Welcome'
end

describe "GET /welcome-visitors.html" do
  before(:all) do
    get "/welcome-visitors.html"
    @response = last_response
    @body = last_response.body
  end

  it_behaves_like 'Welcome'
end

describe "GET /view/welcome-visitors" do
  before(:all) do
    get "/view/welcome-visitors"
    @response = last_response
    @body = last_response.body
  end

  it_behaves_like 'Welcome'
end

describe "GET /view/welcome-visitors/view/indie-web-camp" do
  before(:all) do
    get "/view/welcome-visitors/view/indie-web-camp"
    @response = last_response
    @body = last_response.body
  end

  it_behaves_like 'Welcome'

  it "has a div with class 'page' and id 'indie-web-camp'" do
    @body.should match(/<div class='page' id='indie-web-camp'>/)
  end
end
