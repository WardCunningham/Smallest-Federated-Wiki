require 'rubygems'
require 'bundler'
require 'pathname'
Bundler.require

$LOAD_PATH.unshift(File.dirname(__FILE__))
root_path = File.dirname(File.dirname(__FILE__)) # one level up
APP_ROOT = Pathname.new(root_path).realpath.to_s # full path to application root

require 'random_id'
require 'page'
require 'favicon'

class Controller < Sinatra::Base
  set :port, 1111
  set :public, File.join(APP_ROOT, "client")
  set :views , File.join(APP_ROOT, "server", "views")
  set :haml, :format => :html5

  class << self # overridden in test
    def data_root
      File.join APP_ROOT, "data"
    end
  end

  def identity
    default_path = File.join APP_ROOT, "default-data", "status", "local-identity"
    real_path = File.join @status, "local-identity"
    unless File.exist? real_path
      FileUtils.mkdir_p File.dirname(real_path)
      FileUtils.cp default_path, real_path
    end

    JSON.parse(File.read(real_path))
  end

  before do
    # This seems to be spawning 'mkdir -p' on every request.
    # TODO: run just once at startup, and/or only when needed.
    data = File.exists?(File.join(self.class.data_root, "farm")) ? File.join(self.class.data_root, "farm", request.host) : self.class.data_root
    @status = File.join(data, "status")
    Page.directory = @pages = File.join(data, "pages")
    Page.default_directory = File.join APP_ROOT, "default-data", "pages"
    FileUtils.mkdir_p @status
    FileUtils.mkdir_p @pages
  end

  helpers do
    def cross_origin
      headers 'Access-Control-Allow-Origin' => "*" if request.env['HTTP_ORIGIN']
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

  get '/style.css' do
    content_type 'text/css'
    sass :style
  end

  get '/favicon.png' do
    content_type 'image/png'
    cross_origin
    local = File.join @status, 'favicon.png'
    Favicon.create local unless File.exists? local
    File.read local
  end

  get '/random.png' do
    content_type 'image/png'
    local = File.join @status, 'favicon.png'
    Favicon.create local
    File.read local
  end

  get '/' do
    haml :view, :locals => {:page_names => [identity['root']]}
  end

  get %r{^/([a-z0-9-]+)\.html$} do |name|
    haml :page, :locals => { :page => Page.get(name), :page_name => name }
  end
  get %r{^/view/([a-z0-9-]+(/view/[a-z0-9-]+)*)$} do |pages,extra|
    haml :view, :locals => {:page_names => pages.split('/view/')}
  end

  get %r{^/([a-z0-9-]+)\.json$} do |name|
    content_type 'application/json'
    cross_origin
    JSON.pretty_generate(Page.get(name))
  end

  put %r{^/page/([a-z0-9-]+)/action$} do |name|
    page = Page.get(name)
    action = JSON.parse params['action']
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
    Page.put name, page
    "ok"
  end

  get %r{^/remote/([a-zA-Z0-9:\.-]+)/([a-z0-9-]+)\.json$} do |site, name|
    content_type 'application/json'
    RestClient.get "#{site}/#{name}.json"
  end

  get %r{^/remote/([a-zA-Z0-9:\.-]+)/favicon.png$} do |site|
    content_type 'image/png'
    RestClient.get "#{site}/favicon.png"
  end

end
