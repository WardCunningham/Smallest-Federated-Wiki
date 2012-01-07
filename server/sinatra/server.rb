require 'rubygems'
require 'bundler'
require 'pathname'
Bundler.require

$LOAD_PATH.unshift(File.dirname(__FILE__))
SINATRA_ROOT = File.expand_path(File.dirname(__FILE__))
APP_ROOT = File.expand_path(File.join(SINATRA_ROOT, "..", ".."))

require 'random_id'
require 'page'
require 'favicon'

require 'openid'
require 'openid/store/filesystem'

class Controller < Sinatra::Base
  set :port, 1111
  set :public, File.join(APP_ROOT, "client")
  set :views , File.join(SINATRA_ROOT, "views")
  set :haml, :format => :html5

  class << self # overridden in test
    def data_root
      File.join APP_ROOT, "data"
    end
  end

  def farm_page
    data = File.exists?(File.join(self.class.data_root, "farm")) ? File.join(self.class.data_root, "farm", request.host) : self.class.data_root
    page = Page.new
    page.directory = File.join(data, "pages")
    page.default_directory = File.join APP_ROOT, "default-data", "pages"
    FileUtils.mkdir_p page.directory
    page
  end

  def farm_status
    data = File.exists?(File.join(self.class.data_root, "farm")) ? File.join(self.class.data_root, "farm", request.host) : self.class.data_root
    status = File.join(data, "status")
    FileUtils.mkdir_p status
    status
  end

  def identity
    default_path = File.join APP_ROOT, "default-data", "status", "local-identity"
    real_path = File.join farm_status, "local-identity"
    unless File.exist? real_path
      FileUtils.mkdir_p File.dirname(real_path)
      FileUtils.cp default_path, real_path
    end

    JSON.parse(File.read(real_path))
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

    def openid_consumer
      @openid_consumer ||= OpenID::Consumer.new(session, OpenID::Store::Filesystem.new("#{farm_status}/tmp/openid"))
    end

  end

  post '/login' do
    identifier = params[:identifier]
    request = openid_consumer.begin(identifier)
    root_url = request.url.match(/(^.*\/{2}[^\/]*)/)[1]

    redirect request.redirect_url(root_url, root_url + "/login/openid/complete")
  end

  get '/login/openid/complete' do
    response = openid_consumer.complete(params, request.url)
    case response.status
      when OpenID::Consumer::FAILURE
        "Login failure"

      when OpenID::Consumer::SETUP_NEEDED
        "'Setup needed'"

      when OpenID::Consumer::CANCEL
        "Login cancelled"
      when OpenID::Consumer::SUCCESS
        id = params['openid.identity']
        id_file = File.join farm_status, "open_id.identity"
        if File.exist?(id_file)
          stored_id = File.read(id_file)
          if stored_id == id
            "Success! it matches"
          else
            "this is not your wiki"
          end
        else
          File.open(id_file, "w") {|f| f << id }
          "You have registered this wiki to #{id}"
        end
    end
  end

  get '/style.css' do
    content_type 'text/css'
    sass :style
  end

  get '/favicon.png' do
    content_type 'image/png'
    cross_origin
    local = File.join farm_status, 'favicon.png'
    Favicon.create local unless File.exists? local
    File.read local
  end

  get '/random.png' do
    content_type 'image/png'
    local = File.join farm_status, 'favicon.png'
    Favicon.create local
    File.read local
  end

  get '/' do
    haml :view, :locals => {:pages => [ {:id => identity['root']} ]}
  end

  get '/plugins/factory.js' do
    # soon we'll construct this table from metadata
    catalog = 'window.catalog = {
      "ByteBeat": {"menu": "8-bit Music by Formula"},
      "MathJax": {"menu": "TeX Formatted Equations"},
      "Calculator": {"menu": "Running Sums for Expenses"}
    };'
    catalog + File.read(File.join(APP_ROOT, "client/plugins/meta-factory.js"))
  end

  get %r{^/([a-z0-9-]+)\.html$} do |name|
    haml :page, :locals => { :page => farm_page.get(name), :page_name => name }
  end

  domain = "(view|([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+))"
  get %r{^/(#{domain}/[a-z0-9-]+(/#{domain}/[a-z0-9-]+)*)$} do
    elements = params[:captures].first.split('/')
    pages = []
    while (site = elements.shift) && (id = elements.shift)
      if site == 'view' || site == 'my'
        pages << {:id => id}
      else
        pages << {:id => id, :site => site}
      end
    end
    haml :view, :locals => {:pages => pages}
  end

  get %r{^/([a-z0-9-]+)\.json$} do |name|
    content_type 'application/json'
    cross_origin
    JSON.pretty_generate(farm_page.get(name))
  end

  put %r{^/page/([a-z0-9-]+)/action$} do |name|
    action = JSON.parse params['action']
    if site = action['fork']
      page = JSON.parse RestClient.get("#{site}/#{name}.json")
      ( page['journal'] ||= [] ) << { 'type' => 'fork', 'site' => site }
      farm_page.put name, page
      action.delete 'fork'
    else
      page = farm_page.get(name)
    end
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
    farm_page.put name, page
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
