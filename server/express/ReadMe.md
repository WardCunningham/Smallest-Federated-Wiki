# Running specs

* Make sure you have Ruby 1.9.x installed, as well as the 'bundler' gem
* Run `bundle install` in the root
* Start the Express server at port 3000, with the data directory set at {root}/spec/data
* Run `TEST_NODE=true bundle exec rspec spec/integration_spec.rb`. This will run the integration specs against the node/express server.
