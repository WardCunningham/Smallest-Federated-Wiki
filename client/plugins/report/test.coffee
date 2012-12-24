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
			count = (i) -> report.advance(date, issue, i).toString()
			expect(count -1).to.contain "Sun Dec 16 2012 00:00:00"
			expect(count 0).to.contain "Sun Dec 23 2012 00:00:00"
			expect(count 1).to.contain "Sun Dec 30 2012 00:00:00"
			expect(count 2).to.contain "Sun Jan 06 2013 00:00:00"

		it 'handles weeks with offsets (noon > now)', ->
			[issue] = report.parse "WEEKLY TUESDAY NOON"
			date = new Date 2012, 12-1, 25, 3, 4, 5
			count = (i) -> report.advance(date, issue, i).toString()
			expect(count -1).to.contain "Tue Dec 11 2012 12:00:00"
			expect(count 0).to.contain "Tue Dec 18 2012 12:00:00"
			expect(count 1).to.contain "Tue Dec 25 2012 12:00:00"
			expect(count 2).to.contain "Tue Jan 01 2013 12:00:00"

		it 'handles years with offsets (march < now)', ->
			[issue] = report.parse "YEARLY MARCH FRIDAY EVENING"
			date = new Date 2012, 12-1, 25, 3, 4, 5
			count = (i) -> report.advance(date, issue, i).toString()
			expect(count -1).to.contain "Fri Mar 04 2011 18:00:00"
			expect(count 0).to.contain "Fri Mar 02 2012 18:00:00"
			expect(count 1).to.contain "Fri Mar 01 2013 18:00:00"
			expect(count 2).to.contain "Fri Mar 07 2014 18:00:00"

		it 'handles election day (election > now)', ->
			[issue] = report.parse "YEARLY NOVEMBER MONDAY TUESDAY MORNING"
			date = new Date 2016, 1, 2, 3, 4, 5
			count = (i) -> report.advance(date, issue, i).toString()
			expect(count -1).to.contain "Tue Nov 04 2014 06:00:00"
			expect(count 0).to.contain "Tue Nov 03 2015 06:00:00"
			expect(count 1).to.contain "Tue Nov 08 2016 06:00:00"
			expect(count 2).to.contain "Tue Nov 07 2017 06:00:00"
