class FileStore < Store
  class << self

    ### GET

    def get_text(path)
      File.read path if File.exist? path
    end

    def get_blob(path)
      File.binread path if File.exist? path
    end

    ### PUT

    def put_text(path, text, metadata=nil)
      # Note: metadata is ignored for filesystem storage
      File.open(path, 'w'){ |file| file.write text }
      text
    end

    def put_blob(path, blob)
      File.open(path, 'wb'){ |file| file.write blob }
      blob
    end

    ### COLLECTIONS

    def annotated_pages(pages_dir)
      Dir.foreach(pages_dir).reject{|name|name =~ /^\./}.collect do |name|
        page = get_page(File.join pages_dir, name)
        page.merge!({
          'name' => name,
          'updated_at' => File.new("#{pages_dir}/#{name}").mtime
        })
      end
    end

    ### UTILITY

    def farm?(data_root)
      ENV['FARM_MODE'] || File.exists?(File.join data_root, "farm")
    end

    def mkdir(directory)
      FileUtils.mkdir_p directory
    end

    def exists?(path)
      File.exists?(path)
    end
  end
end
