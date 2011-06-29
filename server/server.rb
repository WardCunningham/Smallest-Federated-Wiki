require 'rubygems'
require 'sinatra'
require 'haml'
require 'sass'
require 'json'

set :public, 'client'
set :haml, :format => :html5

helpers do  
  def get_page name
    File.open("data/pages/#{name}", 'r') { |file| JSON.parse(file.read)}
  end
  def resolve_links string
    string.
      gsub(/\[\[([a-z-]+)\]\]/, '<a href="/\1">\1</a>').
      gsub(/\[(http.*?) (.*?)\]/, '<a href="\1">\2</a>')
  end
end

configure do
  $identity = File.open("data/status/local-identity", 'r') { |file| JSON.parse(file.read) }
end

get '/style.css' do
  content_type 'text/css'
  sass :style
end

get '/' do
  haml :page, :locals => { :page => get_page($identity['root']) }
end

get %r{/([a-z-]+)} do |name|
  haml :page, :locals => { :page => get_page(name) }
end