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
      File.open(File.join(APP_ROOT, "data/pages/#{name}"), 'r') { |file| JSON.parse(file.read) }
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
    page = get_page(name)
    edit = JSON.parse(params['edit'])
    page['story'] = edit['order'].collect{ |id| page['story'].detect{ |item| item['id'] == id } }
    ( page['journal'] ||= [] ) << edit # todo: journal undo, not redo
    # put_page name, page
    "ok"
  end

  get %r{^/view/([a-z0-9-]+)$} do |name|
    haml :view, :locals => {:page_names => [name], :page_name => name}
  end

  get %r{^/view/([a-z0-9-]+)/view/([a-z-]+)$} do |n1, n2|
    haml :view, :locals => {:page_names => [n1, n2], :page_name => n1}
  end

  get %r{^/view/([a-z0-9-]+)/view/([a-z-]+)/view/([a-z-]+)$} do |n1, n2, n3|
    haml :view, :locals => {:page_names => [n1, n2, n3], :page_name => n1}
  end
end
