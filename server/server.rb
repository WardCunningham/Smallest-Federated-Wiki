require 'rubygems'
require 'bundler'
require 'pathname'
require 'png'
Bundler.require

$LOAD_PATH.unshift(File.dirname(__FILE__))
root_path = File.dirname(File.dirname(__FILE__)) # one level up
APP_ROOT = Pathname.new(root_path).realpath.to_s # full path to application root

require 'random_id'
require 'page'



class Controller < Sinatra::Base
  set :port, 1111
  set :public, "#{APP_ROOT}/client"
  set :views , "#{APP_ROOT}/server/views"
  set :haml, :format => :html5

  class << self
    def data_root
      "#{APP_ROOT}/data"
    end
  end

  def identity
    relative_path = "status/local-identity"
    default_path = File.join("#{APP_ROOT}/default-data", relative_path)
    real_path = File.join(self.class.data_root, relative_path)

    unless File.exist? real_path
      FileUtils.mkdir_p File.dirname(real_path)
      FileUtils.cp default_path, real_path
    end

    JSON.parse(File.read(real_path))
  end

  before do
    pages = File.exists?(File.join(self.class.data_root, "farm")) ? "farm/#{request.host}" : "pages"
    Page.directory = File.join(self.class.data_root, pages)
    Page.default_directory = "#{APP_ROOT}/default-data/pages"
  end

  helpers do
    def gen_id
      RandomId.generate
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

  def mkfavicon local
    canvas = PNG::Canvas.new 32, 32
    light = PNG::Color.from_hsv(256*rand,255,200).rgb()
    dark = PNG::Color.from_hsv(256*rand,255,125).rgb()
    angle = 2 * (rand()-0.5)
    sin = Math.sin angle
    cos = Math.cos angle
    scale = sin.abs + cos.abs
    for x in (0..31)
      for y in (0..31)
        p = (sin >= 0 ? sin*x+cos*y : -sin*(31-x)+cos*y) / 31 / scale
        canvas[x,y] = PNG::Color.new(
          light[0]*p + dark[0]*(1-p),
          light[1]*p + dark[1]*(1-p),
          light[2]*p + dark[2]*(1-p))
      end
    end
    png = PNG.new canvas
    png.save local
  end

  get '/favicon.png' do
    content_type 'image/png'
    local = File.join self.class.data_root, 'status/favicon.png'
    mkfavicon local unless File.exists? local
    File.read local
  end

  get '/random.png' do
    content_type 'image/png'
    local = File.join self.class.data_root, 'status/random.png'
    mkfavicon local
    File.read local
  end

  get '/' do
    haml :view, :locals => {:page_names => [identity['root']]}
  end

  get %r{^/([a-z0-9-]+)\.html$} do |name|
    haml :view, :locals => {:page_names => [name]}
  end
  get %r{^/view/([a-z0-9-]+(/view/[a-z0-9-]+)*)$} do |pages,extra|
    haml :view, :locals => {:page_names => pages.split('/view/')}
  end

  get %r{^/([a-z0-9-]+)\.json$} do |name|
    content_type 'application/json'
    JSON.pretty_generate(Page.get(name))
  end

  put %r{^/page/([a-z0-9-]+)/action$} do |name|
    page = Page.get(name)
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
    Page.put name, page
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
