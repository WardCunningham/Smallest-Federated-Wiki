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
  page = get_page($identity['root'])
  title = page['title']
  paragraphs = page['body'].collect {|each| "<p>#{each['text']}</p>"}
  "<h1>#{$identity['title']}</h1><h2>#{title}</h2>#{paragraphs.join("\n")}</pre>"
end

get '/page/:name' do |name|
  page = get_page(name)
  title = page['title']
  paragraphs = page['body'].collect {|each| "<p>#{each['text']}</p>"}
  "<h1>#{$identity['title']}</h1><h2>#{title}</h2>#{paragraphs.join("\n")}</pre>"
end