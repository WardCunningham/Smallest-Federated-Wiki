require 'rubygems'
require 'pathname'
require 'bundler'
Bundler.require

class Controller < Sinatra::Base
  root_path = File.dirname(File.dirname(__FILE__))
  APP_ROOT = Pathname.new(root_path).realpath.to_s #find full path to this file

  set :public, "#{APP_ROOT}/client"
  set :views , "#{APP_ROOT}/server/views"  
  set :haml, :format => :html5

  helpers do  
    def get_page name
      path = File.join(APP_ROOT, "data/pages/#{name}")
      return {'title'=>name,'story'=>[{'type'=>'factory'}]} unless File.file? path
      File.open(path, 'r') { |file| JSON.parse(file.read) }
    end
    def put_page name, page
      File.open(File.join(APP_ROOT, "data/pages/#{name}"), 'w') { |file| file.write(JSON.generate(page)) }
    end
    def resolve_links string
      string.
        gsub(/\[\[([a-z0-9-]+)\]\]/, '<a href="/\1">\1</a>').
        gsub(/\[(http.*?) (.*?)\]/, '<a href="\1">\2</a>')
    end
  end

  configure do
    $identity = File.open(File.join(APP_ROOT, "data/status/local-identity"), 'r') { |file| JSON.parse(file.read) }
    `cd #{APP_ROOT}/data/pages; cp default-welcome-visitors welcome-visitors` unless File.exists? File.join(APP_ROOT,'data/pages/welcome-visitors')
  end

  get '/style.css' do
    content_type 'text/css'
    sass :style
  end

  get '/' do
    haml :page, :locals => { :page => get_page($identity['root']), :page_name => $identity['root'] }
  end

  get %r{^/([a-z0-9-]+)$} do |name|
    haml :page, :locals => { :page => get_page(name), :page_name => name }
  end

  get %r{^/([a-z0-9-]+)/json$} do |name|
    content_type 'text/plain'
    JSON.pretty_generate(get_page(name))
  end

  put %r{^/page/([a-z0-9-]+)/edit$} do |name|
    page = get_page name
    edit = JSON.parse params['edit']
    puts edit.inspect
    item = page['story'].detect{ |item| item['id'] == edit['id'] } if edit['id']
    case edit['type']
    when 'move'
      page['story'] = edit['order'].collect{ |id| page['story'].detect{ |item| item['id'] == id } }
    when 'add'
      before = edit['after'] ? 1+page['story'].index{|item| item['id'] == edit['after']} : 0
      page['story'].insert before, edit['item']
    when 'remove'
      page['story'].delete_at page['story'].index{ |item| item['id'] == edit['id'] }
    when 'edit'
      item['text'] = edit['text']
    else
      puts "unfamiliar edit: #{edit.inspect}"
      status 501
      return "unfamiliar edit"
    end
    ( page['journal'] ||= [] ) << edit # todo: journal undo, not redo
    put_page name, page
    "ok"
  end

  get %r{^/view/([a-z0-9-]+(/view/[a-z0-9-]+)+)$} do |pages,extra|
    haml :view, :locals => {:page_names => pages.split('/view/')}
  end
end
