require 'rubygems'
require 'bundler'
require 'pathname'
Bundler.require

$LOAD_PATH.unshift(File.dirname(__FILE__))
root_path = File.dirname(File.dirname(__FILE__)) # one level up
APP_ROOT = Pathname.new(root_path).realpath.to_s # full path to application root

require 'random_id'
require 'page'

Page.directory = File.join(APP_ROOT, 'data/pages')

class Controller < Sinatra::Base
  set :port, 1111
  set :public, "#{APP_ROOT}/client"
  set :views , "#{APP_ROOT}/server/views"  
  set :haml, :format => :html5

  helpers do
    def gen_id
      RandomId.generate
    end

    def get_page name
      Page.get(name)
    end

    def put_page name, page
      Page.put(name, page)
    end

    def resolve_links string
      string.
        gsub(/\[\[([^\]]+)\]\]/i) {
                    |name| 
                    name.gsub!(/^\[\[(.*)\]\]/, '\1')

                    slug = name.gsub(/\s/, '-')
                    slug = slug.gsub(/[^A-Za-z0-9-]/, '').downcase
                    '<a class="internal" href="/'+slug+'.html" data-page-name="'+slug+'">'+name+'</a>'
                }.
        gsub(/\[(http.*?) (.*?)\]/i, '<a class="external" href="\1">\2</a>')
    end
  end

  configure do
    `cd #{APP_ROOT}/data/status; cp default-local-identity local-identity` unless File.exists? File.join(APP_ROOT,'data/status/local-identity')
    $identity = File.open(File.join(APP_ROOT, "data/status/local-identity"), 'r') { |file| JSON.parse(file.read) }
    `cd #{APP_ROOT}/data/pages; cp default-welcome-visitors welcome-visitors` unless File.exists? File.join(APP_ROOT,'data/pages/welcome-visitors')
    `cd #{APP_ROOT}/client; cp default-favicon.png favicon.png` unless File.exists? File.join(APP_ROOT,'client/favicon.png')
  end

  get '/style.css' do
    content_type 'text/css'
    sass :style
  end

  get '/' do
    haml :view, :locals => {:page_names => [$identity['root']]}
  end

  get %r{^/([a-z0-9-]+)\.html$} do |name|
    haml :view, :locals => {:page_names => [name]}
  end
  get %r{^/view/([a-z0-9-]+(/view/[a-z0-9-]+)*)$} do |pages,extra|
    haml :view, :locals => {:page_names => pages.split('/view/')}
  end

  get %r{^/([a-z0-9-]+)\.json$} do |name|
    content_type 'application/json'
    JSON.pretty_generate(get_page(name))
  end

  put %r{^/page/([a-z0-9-]+)/action$} do |name|
    page = get_page name
    action = JSON.parse params['action']
    puts action.inspect
    case action['type']
    when 'move'
      page['story'] = action['order'].collect{ |id| page['story'].detect{ |item| item['id'] == id } }
    when 'add'
      before = action['after'] ? 1+page['story'].index{|item| item['id'] == action['after']} : 0
      page['story'].insert before, action['item']
    when 'remove'
      page['story'].delete_at page['story'].index{ |item| item['id'] == action['id'] }
    when 'edit'
      page['story'][page['story'].index{ |item| item['id'] == action['id'] }] = action['item']
    else
      puts "unfamiliar action: #{action.inspect}"
      status 501
      return "unfamiliar action"
    end
    ( page['journal'] ||= [] ) << action # todo: journal undo, not redo
    put_page name, page
    "ok"
  end

  get %r{^/remote/([a-zA-Z0-9:\.-]+)/([a-z0-9-]+)\.json$} do |site, name|
    content_type 'application/json'
    `curl -s #{site}/#{name}.json`
  end

  get %r{^/remote/([a-zA-Z0-9:\.-]+)/favicon.png$} do |site|
    content_type 'image/png'
    `curl -s #{site}/favicon.png`
  end

end
