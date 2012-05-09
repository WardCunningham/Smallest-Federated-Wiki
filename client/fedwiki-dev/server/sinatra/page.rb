require 'json'
require File.expand_path("../random_id", __FILE__)
require File.expand_path("../stores/all", __FILE__)

class PageError < StandardError; end;

# Page Class
# Handles writing and reading JSON data to and from files.
class Page

    # Directory where pages are to be stored.
    attr_accessor :directory
    # Directory where default (pre-existing) pages are stored.
    attr_accessor :default_directory

    # Get a page
    #
    # @param [String] name - The name of the file to retrieve, relative to Page.directory.
    # @return [Hash] The contents of the retrieved page (parsed JSON).
    def get(name)
      assert_attributes_set
      path = File.join(directory, name)
      default_path = File.join(default_directory, name)
      page = Store.get_page(path)
      if page
        page
      elsif File.exist?(default_path)
        put name, FileStore.get_page(default_path)
      else
        put name, {'title'=>name,'story'=>[{'type'=>'factory', 'id'=>RandomId.generate}]}
      end
    end

    def exists?(name)
      Store.exists?(File.join(directory, name)) or File.exist?(File.join(default_directory, name))
    end

    # Create or update a page
    #
    # @param [String] name - The name of the file to create/update, relative to Page.directory.
    # @param [Hash] page - The page data to be written to the file (it will be converted to JSON).
    # @return [Hash] The contents of the retrieved page (parsed JSON).
    def put(name, page)
      assert_attributes_set
      path = File.join directory, name
      Store.put_page(path, page, :name => name, :directory => directory)
    end

    private

    def assert_attributes_set
      raise PageError.new('Page.directory must be set') unless directory
      raise PageError.new('Page.default_directory must be set') unless default_directory
    end
end
