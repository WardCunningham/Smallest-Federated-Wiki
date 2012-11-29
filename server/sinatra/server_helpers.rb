module ServerHelpers

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
                  '<a class="internal" href="/'+slug+'.html" data-page-name="'+slug+'" >'+name+'</a>'
              }.
      gsub(/\[(http.*?) (.*?)\]/i, '<a class="external" href="\1" rel="nofollow">\2</a>')
  end

  def openid_consumer
    @openid_consumer ||= OpenID::Consumer.new(session, OpenID::Store::Filesystem.new("#{farm_status}/tmp/openid"))
  end

  def authenticated?
    session[:authenticated] == true
  end

  def identified?
    Store.exists? "#{farm_status}/open_id.identifier"
  end

  def claimed?
    Store.exists? "#{farm_status}/open_id.identity"
  end

  def authenticate!
    session[:authenticated] = true
    redirect "/"
  end

  def oops status, message
    haml :oops, :layout => false, :locals => {:status => status, :message => message}
  end

  def serve_resources_locally?(site)
    !!ENV['FARM_DOMAINS'] && ENV['FARM_DOMAINS'].split(',').any?{|domain| site.end_with?(domain)}
  end

  def serve_page(name, site=request.host)
    cross_origin
    halt 404 unless farm_page(site).exists?(name)
    JSON.pretty_generate farm_page(site).get(name)
  end

  def synopsis page
    text = page['synopsis']
    p1 = page['story'] && page['story'][0]
    p2 = page['story'] && page['story'][1]
    text ||= p1 && p1['text'] if p1 && p1['type'] == 'paragraph'
    text ||= p2 && p2['text'] if p2 && p2['type'] == 'paragraph'
    text ||= p1 && p1['text'] || p2 && p2['text'] || page['story'] && "A page with #{page['story'].length} paragraphs." || "A page with no story."
    return text
  end

end

