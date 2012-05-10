def asSlug (name)
  name.gsub(/\s/, '-').gsub(/[^A-Za-z0-9-]/, '').downcase()
end

def section (comment)
  puts "\n\t#{comment}\n"
end

def test (given, expected)
  actual = asSlug given
  puts actual == expected ? "OK\t#{given}" : "YIKES\t#{given} => #{actual}, not #{expected} as expected"
end

# the following test cases presume to be implementation language agnostic
# perhaps they should be included from a common file

# 'WORKING'
section 'case and hyphen insensitive'
test 'Welcome Visitors', 'welcome-visitors'
test 'welcome visitors', 'welcome-visitors'
test 'Welcome-visitors', 'welcome-visitors'


section 'numbers and punctuation'
test '2012 Report', '2012-report'
test 'Ward\'s Wiki', 'wards-wiki'

# 'PROBLEMATIC'
section 'white space insenstive'
test 'Welcome  Visitors', 'welcome-visitors'
test '  Welcome Visitors', 'welcome-visitors'
test 'Welcome Visitors  ', 'welcome-visitors'

section 'foreign language'
test 'Les Misérables', 'les-misérables'
test 'Les Misérables', 'les-miserables'
