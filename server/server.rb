require 'rubygems'
require 'bundler'
Bundler.require

set :public, 'client'
set :haml, :format => :html5
set :port, 8888

helpers do  
  def get_page name
    File.open("data/pages/#{name}", 'r') { |file| JSON.parse(file.read) }
  end
  def put_page name, page
    File.open("data/pages/#{name}", 'w') { |file| file.write(JSON.generate(page)) }
  end
  def resolve_links string
    string.
      gsub(/\[\[([a-z-]+)\]\]/, '<a href="/\1">\1</a>').
      gsub(/\[(http.*?) (.*?)\]/, '<a href="\1">\2</a>')
  end
end

configure do
  $identity = File.open("data/status/local-identity", 'r') { |file| JSON.parse(file.read) }
  `cd data/pages; cp default-welcome-visitors welcome-visitors` unless File.exists? 'data/pages/welcome-visitors'
end

get '/style.css' do
  content_type 'text/css'
  sass :style
end

get '/' do
  haml :page, :locals => { :page => get_page($identity['root']), :page_name => $identity['root'] }
end

get %r{^/([a-z-]+)$} do |name|
  haml :page, :locals => { :page => get_page(name), :page_name => name }
end

get %r{^/([a-z-]+)/json$} do |name|
  content_type 'text/plain'
  JSON.pretty_generate(get_page(name))
end

put %r{^/page/([a-z-]+)/edit$} do |name|
  page = get_page(name)
  edit = JSON.parse(params['edit'])
  page['story'] = edit['order'].collect{ |id| page['story'].detect{ |item| item['id'] == id } }
  ( page['journal'] ||= [] ) << edit # todo: journal undo, not redo
  # put_page name, page
  "ok"
end

get %r{^/view/([a-z-]+)$} do |name|
  haml :view, :locals => {:page_names => name, :page_name => name}
end

get %r{^/view/([a-z-]+)/view/([a-z-]+)$} do |n1, n2|
  haml :view, :locals => {:page_names => [n1, n2], :page_name => n1}
end

get %r{^/view/([a-z-]+)/view/([a-z-]+)/view/([a-z-]+)$} do |n1, n2, n3|
  haml :view, :locals => {:page_names => [n1, n2, n3], :page_name => n1}
end
