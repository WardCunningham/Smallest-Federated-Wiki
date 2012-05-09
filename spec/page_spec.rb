require File.dirname(__FILE__) + '/spec_helper'

describe "Page" do
  before(:all) do
    Store.set 'FileStore', nil
    @page = Page.new
    @page.directory = nil
    @page.default_directory = nil
  end

  context "when @page.directory has not been set" do
    it "raises PageError" do
      expect {
        @page.get('anything')
      }.to raise_error(PageError, /Page\.directory/)
    end
  end

  context "when @page.default_directory has not been set" do
    it "raises PageError" do
      @page.directory = 'tmp'
      expect {
        @page.get('anything')
      }.to raise_error(PageError, /Page\.default_directory/)
    end
  end

  context "when Page directories have been set" do
    before(:all) do
      @root = File.expand_path(File.join(File.dirname(__FILE__), ".."))
      @test_data_dir = File.join(@root, 'spec/data')
      @page.directory = @test_data_dir
      @page.default_directory = File.join(@test_data_dir, 'defaults')
      @page.plugins_directory = File.join(@root, 'client', 'plugins')
    end

    before(:each) do
      FileUtils.rm_rf @page.directory
      FileUtils.mkdir @page.directory
      FileUtils.mkdir @page.default_directory
      @page_data = {'foo' => 'bar'}
    end

    describe "put" do
      context "when page doesn't exist yet" do
        it "creates new page" do
          File.exist?(File.join(@test_data_dir, 'foo')).should be_false
          @page.put('foo', @page_data)
          File.exist?(File.join(@test_data_dir, 'foo')).should be_true
        end

        it "returns the page" do
          @page.put('foo', @page_data).should == @page_data
        end
      end

      context "when page already exists" do
        it "updates the page" do
          @page.put('foo', @page_data).should == @page_data
          new_data = {'buzz' => 'fuzz'}
          @page.put('foo', new_data)
          @page.get('foo').should == new_data
        end
      end
    end

    describe "get" do
      context "when page exists" do
        it "returns the page" do
          @page.put('foo', @page_data).should == @page_data
          @page.get('foo').should == @page_data
        end
      end

      context "when page does not exist" do
        it "creates a factory page" do
          RandomId.stub(:generate).and_return('fake-id')
          foo_data = @page.get('foo')
          foo_data['title'].should == 'foo'
          foo_data['story'].first['id'].should == 'fake-id'
          foo_data['story'].first['type'].should == 'factory'
        end
      end

      context "when page does not exist, but default with same name exists" do
        it "copies default page to new page path and returns it" do
          default_data = {'default' => 'data'}
          @page.put('defaults/foo', default_data)
          @page.get('foo').should == default_data
        end
      end
    end
  end
end
