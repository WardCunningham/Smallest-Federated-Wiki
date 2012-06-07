# encoding: UTF-8
require "rspec"
require_relative "../server/sinatra/slug"

def section (comment)
  $section = comment
  $counter = 0
end

def test (given, expected)
  describe ".slug - #{$section} (#{$counter+=1})" do
    it "should convert the string #{given.inspect} to the slug #{expected.inspect}" do
      FedWiki.slug(given).should == expected
    end
  end
end

# the following test cases presume to be implementation language agnostic
# perhaps they should be included from a common file

section 'case and hyphen insensitive'
test 'Welcome Visitors', 'welcome-visitors'
test 'welcome visitors', 'welcome-visitors'
test 'Welcome-visitors', 'welcome-visitors'
test 'slugs-are-unchanged', 'slugs-are-unchanged'

section 'special characters'
test 'Ward\'s Wiki', 'wards-wiki'
test 'O\'malley', 'omalley'
test 'holy cats !!! you don\'t say', 'holy-cats-you-dont-say'
test '---holy cats !!! -- !@#$%^&*()_{}|:"<>?~"', 'holy-cats'
test 'random chars: !@#$%^&*()_{}|:"<>?~"', 'random-chars'
test 'Pride & Prejudice', 'pride-prejudice'
test '---', ''
test '   ', ''
test ' - - - - ', ''

section 'white space insenstive'
test 'Welcome  Visitors', 'welcome-visitors'
test '  Welcome Visitors', 'welcome-visitors'
test 'Welcome Visitors  ', 'welcome-visitors'

section 'foreign language'
test 'Les Misérables', 'les-misérables'
test 'ßøå∂ƒ', 'ßøåƒ'

section 'non-alphanumeric utf-8 chars'
test '∑®†©¥', ''

