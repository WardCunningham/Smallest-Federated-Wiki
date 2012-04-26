class Store
  class << self

    def select(store_classname, app_root)
      @store_class = store_classname ? Kernel.const_get(store_classname) : FileStore
      @store_class.app_root = app_root
      nil
    end

    def method_missing(*args)
      @store_class.send(*args)
    end

  end
end
