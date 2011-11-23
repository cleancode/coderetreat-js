describe("Harness", function() {
  it("should support expectations", function() {
    expect(1+2).toEqual(3)
    expect(1+2).toBeLessThan(4)
  })

  it("should support asynchronous specifications", function() {
    wait()
    setTimeout(function() {
      expect(true).toBe(true)
      done()
    }, 1)
    expect(false).toBe(false)
  })
})
