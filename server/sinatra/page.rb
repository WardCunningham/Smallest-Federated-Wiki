require 'json'
require File.expand_path("../random_id", __FILE__)

class PageError < StandardError; end;

# Page Class
# Handles writing and reading JSON data to and from files.
class Page
  # class << self
    # Directory where pages are to be stored.
    attr_accessor :directory
    # Directory where default (pre-existing) pages are stored.
    attr_accessor :default_directory

    # Get a page
    #
    # @param [String] name - The name of the file to retrieve, relative to Page.directory.
    # @return [Hash] The contents of the retrieved page (parsed JSON).
    def get(name)
      assert_directories_set

      path = File.join(directory, name)

      if File.exist? path
        load_and_parse path
      else
        default_path = File.join(default_directory, name)

        if File.exist?(default_path)
          FileUtils.mkdir_p File.dirname(path)
          FileUtils.cp default_path, path
          load_and_parse path
        else
          put name, {'title'=>name,'story'=>[{'type'=>'factory', 'id'=>RandomId.generate}]} unless File.file? path
        end
      end
    end

    def exists?(name)
      File.exists?(File.join(directory, name)) or File.exist?(File.join(default_directory, name))
    end

    # Create or update a page
    #
    # @param [String] name - The name of the file to create/update, relative to Page.directory.
    # @param [Hash] page - The page data to be written to the file (it will be converted to JSON).
    # @return [Hash] The contents of the retrieved page (parsed JSON).
    def put(name, page)
      assert_directories_set
      File.open(File.join(directory, name), 'w') { |file| file.write(JSON.pretty_generate(page)) }
      page
    end

    private

    def load_and_parse(path)
      JSON.parse(File.read(path))
    end

    def assert_directories_set
      raise PageError.new('Page.directory must be set') unless directory
      raise PageError.new('Page.default_directory must be set') unless default_directory
    end
  # end
end
