from ooyala/quantal64-ruby1.9.3
maintainer Peter Stuifzand  "peter@stuifzand.eu"
run gem install bundler
run apt-get install -y ruby-dev
run apt-get install -y libxml2-dev libxslt-dev build-essential git
run gem install nokogiri -v '1.5.6'
add . /wiki
expose 1111
volume /wiki/data
run cd /wiki && bundle install --without development test
cmd cd /wiki/server/sinatra && bundle exec rackup -s thin -p 1111
