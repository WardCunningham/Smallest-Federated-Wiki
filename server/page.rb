require 'json'
require File.expand_path("../random_id", __FILE__)

class Page

  class << self
    attr_accessor :directory, :default_directory

    def get name
      path = File.join(directory, name)

      if File.exist? path
        load path
      else
        default_path = File.join(default_directory, name)

        if File.exist?(default_path)
          FileUtils.mkdir_p File.dirname(path)
          FileUtils.cp default_path, path
          load path
        else
          put name, {'title'=>name,'story'=>[{'type'=>'factory', 'id'=>RandomId.generate}]} unless File.file? path
        end
      end
    end

    def put name, page
      File.open(File.join(directory, name), 'w') { |file| file.write(JSON.generate(page)) }
      page
    end

    def load(path)
      JSON.parse(File.read(path))
    end

  end
end
