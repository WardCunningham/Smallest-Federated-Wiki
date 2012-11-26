require('./efficiency')

# TODO find a better way to compare arrays
expectArraysEqual = (a1, a2, accuracy = 0.1) ->
	wiki.log 'expectArraysEqual a1', a1
	wiki.log 'expectArraysEqual a2', a2
	expect(a1.length).to.equal (a2.length)
	length = a1.length
	for i in [0..(length-1)]
		#expect(a1[i]).to.equal a2[i]
		diff = Math.abs(a1[i] - a2[i])
		isItGood =  diff <= accuracy
		wiki.log 'expectArraysEqual diff: ', diff
		expect(isItGood).to.be.ok();
	
describe 'efficiency plugin', ->

  it "calcs 10%", ->
     #installPlugin()
     wiki.log '10%'
     wiki.log 'window.plugins.efficiency ', window.plugins.efficiency
     expect(10).to.equal 10
     expect(5).to.equal window.plugins.efficiency.doAdd(2, 3)


  it "calcs 50%", ->
     #installPlugin()
     wiki.log '50%'
     expect(50).to.equal 50

  it "max & min of array", ->
     #installPlugin()
     wiki.log 'max & min of array'
     expect(6).to.equal (Math.max [1, 2, 3, 4, 5, 6]...)
     expect(1).to.equal (Math.min [1, 2, 3, 4, 5, 6]...)

  it "Get gray luma from 4-byte RGBT data. Two values", ->
	 wiki.log 'get luma, two values'
	 rgbt = [1.0, 1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 2.0]
	 expectedLuma = [1.0, 2.0]
	 
	 actualArray = window.plugins.efficiency.getGrayLumaFromRGBT(rgbt)
	 expected = JSON.stringify(expectedLuma)
	 actual = JSON.stringify(actualArray)
	 #expect(expected == actual).to.be.ok();
	 #expect(expected).to.equal (actual)
	 expectArraysEqual(expectedLuma, actualArray)
	
  it "Get gray luma from 4-byte RGBT data. Three values", ->
	 wiki.log 'get luma, three values'
	 rgbt = [1.0, 1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 2.0, 3.0, 3.0, 3.0, 3.0]
	 expectedLuma = [1.0, 2.0, 3.0]

	 actualArray = window.plugins.efficiency.getGrayLumaFromRGBT(rgbt)
	 expected = JSON.stringify(expectedLuma)
	 actual = JSON.stringify(actualArray)
	 #expect(expected == actual).to.be.ok();
	 #expect(expected).to.equal (actual)
	 expectArraysEqual(expectedLuma, actualArray)
	
  it "calcs 50% 2", ->
     #installPlugin()
     wiki.log '50% 2'
     expect(50).to.equal 50



  
