require File.dirname(__FILE__) + '/spec_helper'

class TestHelpers
  include ServerHelpers
end

describe 'Server helpers' do
  let(:helpers) { TestHelpers.new }

  describe "#serve_resources_locally?" do
    it "should be true when FARM_DOMAINS is set to the current domain" do
      ENV['FARM_DOMAINS'] = 'me.com'
      helpers.serve_resources_locally?('me.com').should == true
    end

    it "should be true when FARM_DOMAINS is set to the *root domain* of the current subdomain" do
      ENV['FARM_DOMAINS'] = 'forkthis.net'
      helpers.serve_resources_locally?('jack.forkthis.net').should == true
      helpers.serve_resources_locally?('jacks-thoughts.jack.forkthis.net').should == true
    end

    it "should be false when the environment variable FARM_DOMAINS is not set" do
      helpers.serve_resources_locally?('anything.com').should == false
    end

    it "should be false when FARM_DOMAINS does not includes the current domain" do
      ENV['FARM_DOMAINS'] = 'you.com'
      helpers.serve_resources_locally?('hoodoo.com').should == false
    end

    describe "FARM_DOMAINS includes multiple domains" do
      it "should be true when FARM_DOMAINS includes the current domain" do
        ENV['FARM_DOMAINS'] = 'we.com,me.com,you.com'
        helpers.serve_resources_locally?('me.com').should == true
      end

      it "should be false when FARM_DOMAINS does not includes the current domain" do
        ENV['FARM_DOMAINS'] = 'we.com,me.com,you.com'
        helpers.serve_resources_locally?('hoodoo.com').should == false
      end

      it "should be true when FARM_DOMAINS is set to the *root domain* of the current subdomain" do
        ENV['FARM_DOMAINS'] = 'bar.com,forkthis.net,foo.com'
        helpers.serve_resources_locally?('jack.forkthis.net').should == true
        helpers.serve_resources_locally?('jacks-thoughts.jack.forkthis.net').should == true
      end
    end
  end
end
