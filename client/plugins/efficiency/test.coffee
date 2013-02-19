require('./efficiency')

# TODO find a better way to compare arrays of floats
expectArraysEqual = (a1, a2, accuracy = 0.1) ->
	# wiki.log 'expectArraysEqual a1', a1
	# wiki.log 'expectArraysEqual a2', a2
	expect(a1.length).to.equal (a2.length)
	length = a1.length
	for i in [0..(length-1)]
		diff = Math.abs(a1[i] - a2[i])
		isItGood =  diff <= accuracy
		# wiki.log 'expectArraysEqual diff: ', diff
		expect(isItGood).to.be.ok();
		

describe 'efficiency plugin', ->

  it "max & min of array", ->
     # wiki.log 'max & min of array'
     expect(6).to.equal (Math.max [1, 2, 3, 4, 5, 6]...)
     expect(1).to.equal (Math.min [1, 2, 3, 4, 5, 6]...)

  it "Get gray luma from 4-byte RGBT data. Two values", ->
	 # wiki.log 'get luma, two values'
	 rgbt = [1, 1, 1, 1,   2, 2, 2, 2]
	 expectedLuma = [1.0, 2.0]
	 
	 actualArray = window.plugins.efficiency.getGrayLumaFromRGBT(rgbt)
	 expected = JSON.stringify(expectedLuma)
	 actual = JSON.stringify(actualArray)
	 expectArraysEqual(expectedLuma, actualArray)
	
  it "Get gray luma from 4-byte RGBT data. Three values", ->
	 # wiki.log 'get luma, three values'
	 rgbt = [1, 1, 1, 1,   2, 2, 2, 2,   3, 3, 3, 3]
	 expectedLuma = [1.0, 2.0, 3.0]

	 actualArray = window.plugins.efficiency.getGrayLumaFromRGBT(rgbt)
	 expected = JSON.stringify(expectedLuma)
	 actual = JSON.stringify(actualArray)
	 expectArraysEqual(expectedLuma, actualArray)

  it "calculateStrategy_GrayBinary 50% binary data", ->
     # wiki.log 'calculateStrategy_GrayBinary 50% binary'
     lumas = [0, 0, 255, 255]
     output = window.plugins.efficiency.calculateStrategy_GrayBinary(lumas)
     expect('50.0').to.equal(output.toFixed(1))

  it "calculateStrategy_GrayBinary 50% linear data", ->
     # wiki.log 'calculateStrategy_GrayBinary 50%  linear'
     lumas = [1, 2, 3, 4]
     output = window.plugins.efficiency.calculateStrategy_GrayBinary(lumas)
     expect('50.0').to.equal(output.toFixed(1))

  it "calculateStrategy_GrayBinary 75% binary data", ->
     # wiki.log 'calculateStrategy_GrayBinary 75% binary'
     lumas = [0, 255, 255, 255]
     output = window.plugins.efficiency.calculateStrategy_GrayBinary(lumas)
     expect('75.0').to.equal(output.toFixed(1))

  it "calculateStrategy_GrayIterativeClustering 50% binary data", ->
     # wiki.log 'calculateStrategy_GrayIterativeClustering 50% binary'
     lumas = [0, 0, 255, 255]
     output = window.plugins.efficiency.calculateStrategy_GrayIterativeClustering(lumas)
     expect('50.0').to.equal(output.toFixed(1))

  it "calculateStrategy_GrayIterativeClustering 50% linear data", ->
     # wiki.log 'calculateStrategy_GrayIterativeClustering 50% linear'
     lumas = [1, 2, 3, 4]
     output = window.plugins.efficiency.calculateStrategy_GrayIterativeClustering(lumas)
     expect('50.0').to.equal(output.toFixed(1))

  it "calculateStrategy_GrayIterativeClustering 75% binary data", ->
     # wiki.log 'calculateStrategy_GrayIterativeClustering 75% binary'
     lumas = [0, 255, 255, 255]
     output = window.plugins.efficiency.calculateStrategy_GrayIterativeClustering(lumas)
     expect('75.0').to.equal(output.toFixed(1))




  
