require 'json'
require File.expand_path("../random_id", __FILE__)

class PageError < StandardError; end;

class Page
  class << self
    attr_accessor :directory, :default_directory

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
  end
end
