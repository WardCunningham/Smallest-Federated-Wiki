require File.dirname(__FILE__) + '/../spec_helper'
require File.dirname(__FILE__) + '/../../server/sinatra/stores/all'

describe CouchStore do
  before :each do
    CouchStore.app_root = ''
  end

  before :each do
    @db = CouchStore.db = double()
    @couch_doc = double(:save => nil, :merge! => nil, :[]= => nil)
  end

  describe 'put_text' do
    it 'should store a string to Couch' do
      @db.should_receive(:save_doc) do |hash|
        hash['_id'].should == 'some/path/segments'
        hash['data'].should == 'value -- any sting data'
      end

      CouchStore.put_text('some/path/segments', 'value -- any sting data')
    end

    it 'should convert full paths to relative paths' do
      CouchStore.app_root = '/home/joe/sfw/'
      @db.should_receive(:save_doc) do |hash|
        hash['_id'].should == 'data/pages/joes-place'
        hash['data'].should == '<h1>Joe\'s Place</h1>'
        hash['directory'].should == 'data/pages/'
        hash['any_param'].should == '/home/jennifer/sfw/is/not/affected'
      end

      CouchStore.put_text '/home/joe/sfw/data/pages/joes-place', '<h1>Joe\'s Place</h1>', {
        'directory' => '/home/joe/sfw/data/pages/',
        'any_param' => '/home/jennifer/sfw/is/not/affected',
      }

    end

    it 'should not blow up even when Couch initially raises a "conflict" exception' do
      @db.should_receive(:save_doc).and_raise(RestClient::Conflict)
      @db.should_receive(:get).and_return(@couch_doc)  # .with('same/key/a/second/time')

      CouchStore.put_text('same/key/a/second/time', 'value')
    end

    it 'should return the data' do
      CouchStore.db = double(:save_doc => nil)
      CouchStore.put_text('key', 'value').should == 'value'
    end
  end

  describe 'get_text' do
    it 'retrieve a string from Couch' do
      @db.should_receive(:get).with('some/path/segments').and_return('data' => 'some string value')

      CouchStore.get_text('some/path/segments').should == 'some string value'
    end

    it 'should not blow up even when Couch raises a "not found" exception' do
      @db.should_receive(:get).and_raise(RestClient::ResourceNotFound)

      CouchStore.get_text('not/found/key').should be_nil
    end

    it 'should return the data' do
      CouchStore.db = double(:get => {'data' => 'value'})

      CouchStore.get_text('key').should == 'value'
    end
  end

end

