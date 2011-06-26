require 'rubygems'
require 'sinatra'
require 'haml'
require 'sass'
require 'json'

helpers do  
  def get_page name
    File.open("data/pages/#{name}", 'r') { |file| JSON.parse(file.read)}
  end
  def resolve_links string
    string.gsub(/\[\[([a-z-]+)\]\]/, '<a href="/page/\1">\1</a>')
  end
  def render_page name
    page = get_page name
    title = page['title']
    paragraphs = page['body'].collect {|each| "<p>#{each['text']}</p>"}
    "<h1>#{$identity['title']}</h1><h2>#{title}</h2>#{resolve_links(paragraphs.join("\n"))}"
  end
end

configure do
  $identity = File.open("data/status/local-identity", 'r') { |file| JSON.parse(file.read) }
end

get '/' do
  render_page($identity['root'])
end

get '/page/:name' do |name|
  render_page(name)
end