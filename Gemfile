source :rubygems

gem "rake"

gem "sinatra", '1.2.6'
gem "haml"
gem "sass"
gem "json"
gem "thin"
gem "RubyInline"
gem "ZenTest", '<= 4.6.0'   # dependency of RubyInline, newer versions break Heroku deploy
gem "png"
gem "rest-client"
gem "ruby-openid"
gem "couchrest"
gem "memcache-client", :require => 'memcache'

group :development do
  gem 'ruby-debug', :require => 'ruby-debug', :platform => :mri_18
  gem 'ruby-debug19', :require => 'ruby-debug19', :platform => :mri_19
  gem "heroku"
end

group :test do
  gem 'rack-test'          , '0.5.6'  ,  :require => 'rack/test'
  gem 'rspec'              , '2.4.0'
  gem 'rspec-core'         , '2.4.0'
  gem 'rspec-expectations' , '2.4.0'
  gem 'rspec-mocks'        , '2.4.0'
  gem 'capybara'
  gem 'launchy'
  gem 'selenium-webdriver', '2.22.2'
end
