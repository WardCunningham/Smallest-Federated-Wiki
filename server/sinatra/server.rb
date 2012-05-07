require 'rubygems'
require 'bundler'
require 'pathname'
Bundler.require

$LOAD_PATH.unshift(File.dirname(__FILE__))
SINATRA_ROOT = File.expand_path(File.dirname(__FILE__))
APP_ROOT = File.expand_path(File.join(SINATRA_ROOT, "..", ".."))

Encoding.default_external = Encoding::UTF_8

require 'server_helpers'
require 'stores/all'
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
  set :versions, `git log -10 --oneline` || "no git log"
  enable :sessions
  helpers ServerHelpers

  Store.set ENV['STORE_TYPE'], APP_ROOT

  class << self # overridden in test
    def data_root
      File.join APP_ROOT, "data"
    end
  end

  def farm_page(site=request.host)
    page = Page.new
    page.directory = File.join data_dir(site), "pages"
    page.default_directory = File.join APP_ROOT, "default-data", "pages"
    Store.mkdir page.directory
    page
  end

  def farm_status(site=request.host)
    status = File.join data_dir(site), "status"
    Store.mkdir status
    status
  end

  def data_dir(site)
    Store.farm?(self.class.data_root) ? File.join(self.class.data_root, "farm", site) : self.class.data_root
  end

  def identity
    default_path = File.join APP_ROOT, "default-data", "status", "local-identity"
    real_path = File.join farm_status, "local-identity"
    id_data = Store.get_hash real_path
    id_data ||= Store.put_hash(real_path, FileStore.get_hash(default_path))
  end

  post "/logout" do
    session.delete :authenticated
    redirect "/"
  end

  post '/login' do
    root_url = request.url.match(/(^.*\/{2}[^\/]*)/)[1]
    identifier = params[:identifier]
    open_id_request = openid_consumer.begin(identifier)

    redirect open_id_request.redirect_url(root_url, root_url + "/login/openid/complete")
  end

  get '/login/openid/complete' do
    response = openid_consumer.complete(params, request.url)
    case response.status
      when OpenID::Consumer::FAILURE
        oops 401, "Login failure"
      when OpenID::Consumer::SETUP_NEEDED
        oops 400, "Setup needed"
      when OpenID::Consumer::CANCEL
        oops 400, "Login cancelled"
      when OpenID::Consumer::SUCCESS
        id = params['openid.identity']
        id_file = File.join farm_status, "open_id.identity"
        stored_id = Store.get_text(id_file)
        if stored_id
          if stored_id == id
            # login successful
            authenticate!
          else
            oops 403, "This is not your wiki"
          end
        else
          Store.put_text id_file, id
          # claim successful
          authenticate!
        end
    end
  end

  get '/style.css' do
    content_type 'text/css'
    sass :style
  end

  get '/system/slugs.json' do
    content_type 'application/json'
    cross_origin
    JSON.pretty_generate(Dir.entries(farm_page.directory).reject{|e|e[0] == '.'})
  end

  get '/favicon.png' do
    content_type 'image/png'
    cross_origin
    Favicon.get_or_create(File.join farm_status, 'favicon.png')
  end

  get '/random.png' do
    unless authenticated? or !claimed?
      halt 403
      return
    end

    content_type 'image/png'
    path = File.join farm_status, 'favicon.png'
    Store.put_blob path, Favicon.create_blob
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

  get %r{^((/[a-zA-Z0-9:.-]+/[a-z0-9-]+(_rev\d+)?)+)$} do
    elements = params[:captures].first.split('/')
    pages = []
    elements.shift
    while (site = elements.shift) && (id = elements.shift)
      if site == 'view' || site == 'my'
        pages << {:id => id}
      else
        pages << {:id => id, :site => site}
      end
    end
    haml :view, :locals => {:pages => pages}
  end

  get '/recent-changes.json' do
    content_type 'application/json'
    cross_origin
    bins = Hash.new {|hash, key| hash[key] = Array.new}

    pages = Store.annotated_pages farm_page.directory
    pages.each do |page|
      dt = Time.now - page['updated_at']
      bins[(dt/=60)<1?'Minute':(dt/=60)<1?'Hour':(dt/=24)<1?'Day':(dt/=7)<1?'Week':(dt/=4)<1?'Month':(dt/=3)<1?'Season':(dt/=4)<1?'Year':'Forever']<<page
    end

    story = []
    ['Minute', 'Hour', 'Day', 'Week', 'Month', 'Season', 'Year'].each do |key|
      next unless bins[key].length>0
      story << {'type' => 'paragraph', 'text' => "<h3>Within a #{key}</h3>", 'id' => RandomId.generate}
      bins[key].each do |page|
        next if page['story'].empty?
        site = "#{request.host}#{request.port==80 ? '' : ':'+request.port.to_s}"
        story << {'type' => 'federatedWiki', 'site' => site, 'slug' => page['name'], 'title' => page['title'], 'text' => "", 'id' => RandomId.generate}
      end
    end
    page = {'title' => 'Recent Changes', 'story' => story}
    JSON.pretty_generate(page)
  end

  # get '/global-changes.json' do
  #   content_type 'application/json'
  #   cross_origin
  #   bins = Hash.new {|hash, key| hash[key] = Array.new}
  #   Dir.chdir(File.join(self.class.data_root, "farm")) do
  #     Dir.glob("*") do |site|
  #       Dir.chdir(File.join(site,'pages')) do
  #         count = 100
  #         Dir.glob("*").collect do |slug|
  #           dt = Time.now - File.new(slug).mtime
  #           break if (count -= 1) <= 0
  #           slug = "#{site}/#{slug}"
  #           bins[(dt/=60)<1?'Minute':(dt/=60)<1?'Hour':(dt/=24)<1?'Day':(dt/=7)<1?'Week':(dt/=4)<1?'Month':(dt/=3)<1?'Season':(dt/=4)<1?'Year':'Forever']<<slug
  #         end
  #       end
  #     end
  #   end
  #   story = []
  #   ['Minute', 'Hour', 'Day', 'Week'].each do |key|
  #     next unless bins[key].length>0
  #     story << {'type' => 'paragraph', 'text' => "<h3>Within a #{key}</h3>", 'id' => RandomId.generate}
  #     bins[key].each do |remote|
  #       (site,slug) = remote.split '/'
  #       farm = Page.new
  #       farm.directory = File.join(self.class.data_root, "farm/#{site}")
  #       farm.default_directory = File.join APP_ROOT, "default-data", "pages"
  #       page = farm.get(slug)
  #       next if page['story'].length == 0
  #       site = "#{site}#{request.port==80 ? '' : ':'+request.port.to_s}"
  #       story << {'type' => 'federatedWiki', 'site' => site, 'slug' => slug, 'title' => page['title'], 'text' => "", 'id' => RandomId.generate}
  #     end
  #   end
  #   page = {'title' => 'Recent Changes', 'story' => story}
  #   JSON.pretty_generate(page)
  # end

  get %r{^/([a-z0-9-]+)\.json$} do |name|
    content_type 'application/json'
    serve_page name
  end

  error 403 do
    'Access forbidden'
  end

  put %r{^/page/([a-z0-9-]+)/action$} do |name|
    unless authenticated? or !claimed?
      halt 403
      return
    end

    action = JSON.parse params['action']
    if site = action['fork']
      page = JSON.parse RestClient.get("#{site}/#{name}.json")
      ( page['journal'] ||= [] ) << { 'type' => 'fork', 'site' => site }
      farm_page.put name, page
      action.delete 'fork'
    elsif action['type'] == 'create'
      return halt 409 if farm_page.exists?(name)
      page = action['item'].clone
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
    when 'create'
      page['story'] ||= []
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
    host = site.split(':').first
    if serve_resources_locally?(host)
      serve_page(name, host)
    else
      RestClient.get "#{site}/#{name}.json" do |response, request, result, &block|
        case response.code
        when 200
          response
        when 404
          halt 404
        else
          response.return!(request, result, &block)
        end
      end
    end
  end

  get %r{^/remote/([a-zA-Z0-9:\.-]+)/favicon.png$} do |site|
    content_type 'image/png'
    host = site.split(':').first
    if serve_resources_locally?(host)
      Favicon.get_or_create(File.join farm_status(host), 'favicon.png')
    else
      RestClient.get "#{site}/favicon.png"
    end
  end

end
