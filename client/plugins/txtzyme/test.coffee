txtzyme = require './txtzyme'
console.log txtzyme

describe 'txtzyme plugin', ->

	describe 'parsing', ->

		it 'recognizes definitions', ->
			expect(txtzyme.parse "SECOND 1o500m0o").to.eql {SECOND: ['1o500m0o']}

		it 'recognizes multiple definitions', ->
			expect(txtzyme.parse "SECOND BLINK BLINK\nBLINK 1o500m0o500m").to.eql {SECOND: ['BLINK', 'BLINK'], BLINK: ['1o500m0o500m']}

		it 'blank line separator', ->
			expect(txtzyme.parse "SECOND BLINK BLINK\n\nBLINK 1o500m0o500m").to.eql {SECOND: ['BLINK', 'BLINK'], BLINK: ['1o500m0o500m']}

		it 'indent for continuation', ->
			expect(txtzyme.parse "SECOND BLINK\n BLINK\n\nBLINK\n 1o500m0o500m").to.eql {SECOND: ['BLINK', 'BLINK'], BLINK: ['1o500m0o500m']}

