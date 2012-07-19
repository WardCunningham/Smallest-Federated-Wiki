module FedWiki
  def self.slug(original, options = {})
    massaged = original.dup

    # Replace unsupported chars

    char_white_sub = '-'
    char_other_sub = ''

    massaged.gsub!(/\s+/, char_white_sub)
    massaged.gsub!(/[^[[:alnum:]]-]+/, char_other_sub)

    # No more than one of the separator in a row; no separator at beginning/end of slug

    [ char_white_sub, char_other_sub ].each do |sep|
      unless sep.empty?
        re_sep = Regexp.escape(sep)
        massaged.gsub!(/#{re_sep}{2,}/, sep)
        massaged.gsub!(/^#{re_sep}|#{re_sep}$/, '')
      end
    end

    massaged.downcase!
    massaged
  end

end
