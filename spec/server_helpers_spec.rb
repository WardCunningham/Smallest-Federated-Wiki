# encoding: UTF-8

require File.dirname(__FILE__) + '/spec_helper'

class TestHelpers
  include ServerHelpers
end

describe 'Server helpers' do
  let(:helpers) { TestHelpers.new }

  describe "#resolve_links" do
    it "should leave strings without links alone" do
      helpers.resolve_links('foo').should == 'foo'
    end

    it "should convert wikilinks to slug links" do
      helpers.resolve_links('[[My Page]]').should == '<a class="internal" href="/my-page.html" data-page-name="my-page">My Page</a>'
    end

    it "should leave dashes in the name as dashes in the slug" do
      helpers.resolve_links('[[My-Page]]').should == '<a class="internal" href="/my-page.html" data-page-name="my-page">My-Page</a>'
    end

    it "should create a dash for each whitespace character" do
      helpers.resolve_links('[[   My   Page   ]]').should == '<a class="internal" href="/---my---page---.html" data-page-name="---my---page---">   My   Page   </a>'
    end

    it "should remove non-slug characters" do
      helpers.resolve_links('[[My Page Røøøx!!!]]').should == '<a class="internal" href="/my-page-rx.html" data-page-name="my-page-rx">My Page Røøøx!!!</a>'
    end
  end

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
