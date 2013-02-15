txtzyme = require './txtzyme'
console.log txtzyme

describe 'txtzyme plugin', ->

	describe 'parsing', ->

		it 'recognizes definitions', ->
			expect(txtzyme.parse "SECOND 1o500m0o").to.eql {SECOND: ['1o500m0o']}

		it 'handles empty definitions', ->
			expect(txtzyme.parse "SECOND").to.eql {SECOND: []}

		it 'recognizes multiple definitions', ->
			expect(txtzyme.parse "SECOND BLINK BLINK\nBLINK 1o500m0o500m").to.eql {SECOND: ['BLINK', 'BLINK'], BLINK: ['1o500m0o500m']}

		it 'ignores blank line separator', ->
			expect(txtzyme.parse "SECOND BLINK BLINK\n\nBLINK 1o500m0o500m").to.eql {SECOND: ['BLINK', 'BLINK'], BLINK: ['1o500m0o500m']}

		it 'treates indented lines as continuations', ->
			expect(txtzyme.parse "SECOND BLINK\n BLINK\n\nBLINK\n 1o500m0o500m").to.eql {SECOND: ['BLINK', 'BLINK'], BLINK: ['1o500m0o500m']}

	describe 'applying', ->

		apply = (text, arg) ->
			result = ""
			defn = txtzyme.parse text
			txtzyme.apply defn, 'TEST', arg, (message, stack, done) ->
				result += message
				done()
			result

		it 'recognizes definitions', ->
			expect(apply "TEST 1o").to.eql "1o\n"

		it 'calls definitions', ->
			expect(apply "TEST FOO\nFOO 0o").to.eql "0o\n"

		it 'merges results', ->
			expect(apply "TEST 1o FOO 0o\nFOO 10m").to.eql "1o 10m 0o\n"

		it 'limits call depth', ->
			expect(apply "TEST o TEST").to.eql "o o o o o o o o o o\n"

		it 'handles empty definitions', ->
			expect(apply "TEST").to.eql ""

		it 'handles missing definitions', ->
			expect(apply "TEST FOO").to.eql ""

		it 'recognizes NL as newline', ->
			expect(apply "TEST 100m NL 200m").to.eql "100m\n200m\n"
