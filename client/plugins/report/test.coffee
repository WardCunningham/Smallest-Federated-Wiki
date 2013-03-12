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
			count = (i) -> JSON.stringify(report.advance(date, issue, i))
			expect(count -1).to.contain "2012-12-16T00:00:00.000"
			expect(count 0).to.contain "2012-12-23T00:00:00.000"
			expect(count 1).to.contain "2012-12-30T00:00:00.000"
			expect(count 2).to.contain "2013-01-06T00:00:00.000"

		it 'handles weeks with offsets (noon > now)', ->
			[issue] = report.parse "WEEKLY TUESDAY NOON"
			date = new Date 2012, 12-1, 25, 3, 4, 5
			count = (i) -> JSON.stringify(report.advance(date, issue, i))
			expect(count -1).to.contain "2012-12-11T12:00:00.000"
			expect(count 0).to.contain "2012-12-18T12:00:00.000"
			expect(count 1).to.contain "2012-12-25T12:00:00.000"
			expect(count 2).to.contain "2013-01-01T12:00:00.000"

		it 'handles years with offsets (march < now)', ->
			[issue] = report.parse "YEARLY MARCH FRIDAY EVENING"
			date = new Date 2012, 12-1, 25, 3, 4, 5
			count = (i) -> JSON.stringify(report.advance(date, issue, i))
			expect(count -1).to.contain "2011-03-04T18:00:00.000"
			expect(count 0).to.contain "2012-03-02T18:00:00.000"
			expect(count 1).to.contain "2013-03-01T18:00:00.000"
			expect(count 2).to.contain "2014-03-07T18:00:00.000"

		it 'handles election day (election > now)', ->
			[issue] = report.parse "YEARLY NOVEMBER MONDAY TUESDAY MORNING"
			date = new Date 2016, 1, 2, 3, 4, 5
			count = (i) -> JSON.stringify(report.advance(date, issue, i))
			expect(count -1).to.contain "2014-11-04T06:00:00.000"
			expect(count 0).to.contain "2015-11-03T06:00:00.000"
			expect(count 1).to.contain "2016-11-08T06:00:00.000"
			expect(count 2).to.contain "2017-11-07T06:00:00.000"
