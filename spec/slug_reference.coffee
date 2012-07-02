asSlug = (name) ->
  name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase()
  # name.replace(/\s+/g, '-').replace(/[^A-Za-z0-9-]|^\-+|\-+$/g, '').toLowerCase()

section = (comment) ->
  console.log "\n\t#{comment}\n"

test = (given, expected) ->
  actual = asSlug given
  console.log if actual == expected then "OK\t#{given}" else "YIKES\t#{given} => #{actual}, not #{expected} as expected"

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
test 'Är du där?', 'ar-du-dar' # Swedish
