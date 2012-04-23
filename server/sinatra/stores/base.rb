class BaseStore
  class << self

    attr_writer :app_root

    def select(store_classname, app_root)
      klass = store_classname ? Kernel.const_get(store_classname) : FileStore
      klass.app_root = app_root
      klass
    end

    ### GET

    def get_hash(path)
      json = get_text path
      JSON.parse json if json
    end

    alias_method :get_page, :get_hash

    ### PUT

    def put_hash(path, ruby_data, metadata={})
      json = JSON.pretty_generate(ruby_data)
      put_text path, json, metadata
      ruby_data
    end

    alias_method :put_page, :put_hash

  end
end
