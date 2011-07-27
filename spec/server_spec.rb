require File.dirname(__FILE__) + '/spec_helper'
include Rack::Test::Methods
def app; Controller; end

describe "GET /" do
  it "renders the page" do
    get "/"
    last_response.status.should == 200
  end
end
