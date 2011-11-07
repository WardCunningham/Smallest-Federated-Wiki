require File.dirname(__FILE__) + '/spec_helper'
require 'pp'
include Rack::Test::Methods
require File.expand_path("../../server/page", __FILE__)

describe "Page" do
  before(:all) do
    Page.directory = nil
    Page.default_directory = nil
  end

  context "when Page.directory has not been set" do
    it "raises PageError" do
      expect {
        Page.get('anything')
      }.to raise_error(PageError, /Page\.directory/)
    end
  end

  context "when Page.default_directory has not been set" do
    it "raises PageError" do
      Page.directory = 'tmp'
      expect {
        Page.get('anything')
      }.to raise_error(PageError, /Page\.default_directory/)
    end
  end

  context "when Page directories have been set" do
    before(:all) do
      @root = File.expand_path(File.join(File.dirname(__FILE__), ".."))
      @test_data_dir = File.join(@root, 'spec/data')
      Page.directory = @test_data_dir
      Page.default_directory = File.join(@test_data_dir, 'defaults')
    end

    before(:each) do
      FileUtils.rm_rf @test_data_dir
      FileUtils.mkdir Page.directory
      FileUtils.mkdir Page.default_directory
      @page_data = {'foo' => 'bar'}
    end

    describe "put" do
      context "when page doesn't exist yet" do
        it "creates new page" do
          File.exist?(File.join(@test_data_dir, 'foo')).should be_false
          Page.put('foo', @page_data)
          File.exist?(File.join(@test_data_dir, 'foo')).should be_true
        end

        it "returns the page" do
          Page.put('foo', @page_data).should == @page_data
        end
      end

      context "when page already exists" do
        it "updates the page" do
          Page.put('foo', @page_data).should == @page_data
          new_data = {'buzz' => 'fuzz'}
          Page.put('foo', new_data)
          Page.get('foo').should == new_data
        end
      end
    end

    describe "get" do
      context "when page exists" do
        it "returns the page" do
          Page.put('foo', @page_data).should == @page_data
          Page.get('foo').should == @page_data
        end
      end

      context "when page does not exist" do
        it "creates a factory page" do
          RandomId.stub(:generate).and_return('fake-id')
          foo_data = Page.get('foo')
          foo_data['title'].should == 'foo'
          foo_data['story'].first['id'].should == 'fake-id'
          foo_data['story'].first['type'].should == 'factory'
        end
      end

      context "when page does not exist, but default with same name exists" do
        it "copies default page to new page path and returns it" do
          default_data = {'default' => 'data'}
          Page.put('defaults/foo', default_data)
          Page.get('foo').should == default_data
        end
      end
    end
  end
end
