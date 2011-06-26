require 'rubygems'
require 'sinatra'
require 'haml'
require 'sass'
require 'json'

helpers do  
  def get_page name
    File.open("data/pages/#{name}", 'r') { |file| JSON.parse(file.read)}
  end 
end

configure do
  $identity = File.open("data/status/local-identity", 'r') { |file| JSON.parse(file.read) }
end

get '/' do
  "<h1>#{$identity['title']}</h1><pre>#{get_page($identity['root']).inspect}</pre>"
end