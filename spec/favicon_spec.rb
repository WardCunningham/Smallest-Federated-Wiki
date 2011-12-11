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
			favicon_path = File.join(@test_data_dir, 'favicon-test.png')
			Favicon.create favicon_path
			File.exist?(favicon_path).should be_true
			file = PNG.load_file(favicon_path)
			file.should be_a(PNG::Canvas)
			file.width.should == 32
			file.height.should == 32
		end
	end
end
