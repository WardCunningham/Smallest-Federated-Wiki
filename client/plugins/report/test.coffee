report = require './report'

describe 'report plugin', ->

	describe 'parsing', ->

		it 'returns an array', ->
			schedule = report.parse ""
			expect(schedule).to.eql []

		it 'parses intervals', ->
			[issue] = report.parse "DAILY ward@example.com"
			expect(issue.interval).to.be 'DAILY'

		it 'parses offsets', ->
			[issue] = report.parse "WEEKLY TUESDAY NOON"
			expect(issue.offsets).to.eql ['TUESDAY', 'NOON']

		it 'parses recipients', ->
			[issue] = report.parse "DAILY ward@c2.com root@c2.com"
			expect(issue.recipients).to.eql ['ward@c2.com', 'root@c2.com']

		it 'parses multiple issues', ->
			schedule = report.parse "WEEKLY MONTHLY YEARLY"
			expect(schedule).to.have.length 3

	describe 'advancing', ->

		it 'handles weeks', ->
			[issue] = report.parse "WEEKLY"
			date = new Date 2012, 12-1, 25, 3, 4, 5
			count = (i) -> report.advance(date, issue, i)
			expect(count -1).to.eql new Date 2012, 12-1, 16
			expect(count 0).to.eql new Date 2012, 12-1, 23
			expect(count 1).to.eql new Date 2012, 12-1, 30
			expect(count 2).to.eql new Date 2013, 1-1, 6

		it 'handles weeks with offsets (noon > now)', ->
			[issue] = report.parse "WEEKLY TUESDAY NOON"
			date = new Date 2012, 12-1, 25, 3, 4, 5
			count = (i) -> report.advance(date, issue, i)
			expect(count -1).to.eql new Date 2012, 12-1, 11, 12
			expect(count 0).to.eql new Date 2012, 12-1, 18, 12
			expect(count 1).to.eql new Date 2012, 12-1, 25, 12
			expect(count 2).to.eql new Date 2013, 1-1, 1, 12

		it 'handles years with offsets (march < now)', ->
			[issue] = report.parse "YEARLY MARCH FRIDAY EVENING"
			date = new Date 2012, 12-1, 25, 3, 4, 5
			count = (i) -> report.advance(date, issue, i)
			expect(count -1).to.eql new Date 2011, 3-1, 4, 18
			expect(count 0).to.eql new Date 2012, 3-1, 2, 18
			expect(count 1).to.eql new Date 2013, 3-1, 1, 18
			expect(count 2).to.eql new Date 2014, 3-1, 7, 18

		it 'handles election day (election > now)', ->
			[issue] = report.parse "YEARLY NOVEMBER MONDAY TUESDAY MORNING"
			date = new Date 2016, 1, 2, 3, 4, 5
			count = (i) -> report.advance(date, issue, i)
			expect(count -1).to.eql new Date 2014, 11-1, 4, 6
			expect(count 0).to.eql new Date 2015, 11-1, 3, 6
			expect(count 1).to.eql new Date 2016, 11-1, 8, 6
			expect(count 2).to.eql new Date 2017, 11-1, 7, 6
