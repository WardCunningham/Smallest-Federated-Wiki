require File.dirname(__FILE__) + '/spec_helper'
require 'png/reader'
require 'pp'

describe "Favicon" do
	before(:all) do
		root = File.expand_path(File.join(File.dirname(__FILE__), ".."))
		@test_data_dir = File.join(root, 'spec/data')
	end

	before(:each) do
		FileUtils.rm_rf @test_data_dir
		FileUtils.mkdir @test_data_dir
	end

	describe "create" do
		it "creates a favicon.png image" do
			favicon = Favicon.create_blob
			favicon_path = File.join(@test_data_dir, 'favicon-test.png')
			File.open(favicon_path, 'wb') { |file| file.write(favicon) }
			file = PNG.load_file(favicon_path)
			file.should be_a(PNG::Canvas)
			file.width.should == 32
			file.height.should == 32
		end
	end
end
