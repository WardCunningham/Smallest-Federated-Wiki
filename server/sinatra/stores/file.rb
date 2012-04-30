class FileStore < Store
  class << self

    ### GET

    def get_text(path)
      File.read path if File.exist? path
    end

    alias_method :get_blob, :get_text

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

    def recently_changed_pages(pages_dir)
      Dir.chdir(pages_dir) do
        Dir.glob("*").collect do |name|
          page = get_page(File.join pages_dir, name)
          page.merge!({
            'name' => name,
            'updated_at' => File.new(name).mtime
          })
        end
      end
    end

    ### UTILITY

    def farm?(data_root)
      File.exists?(File.join data_root, "farm")
    end

    def mkdir(directory)
      FileUtils.mkdir_p directory
    end

    def exists?(path)
      File.exists?(path)
    end
  end
end
