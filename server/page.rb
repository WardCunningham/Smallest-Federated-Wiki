require 'json'
require File.expand_path("../random_id", __FILE__)

class Page
  def self.directory=(directory)
    @directory = directory
  end

  def self.directory
    return @directory if @directory
    raise "You must set Page.directory"
  end

  def self.get name
    path = File.join(directory, name)
    return put name, {'title'=>name,'story'=>[{'type'=>'factory', 'id'=>RandomId.generate}]} unless File.file? path
    File.open(path, 'r') { |file| JSON.parse(file.read) }
  end

  def self.put name, page
    File.open(File.join(directory, name), 'w') { |file| file.write(JSON.generate(page)) }
    return page
  end
end
