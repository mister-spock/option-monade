const
    { expect } = require("chai"),
    { LazyOption, Option, None } = require("../lib/option");

describe("A set of functional tests for the 'Option' type", function() {

    it("should adequately chain methods and apply 'map' funtion producing new instance of Option", function() {
        let mapWasCalled = false;

        const result = Option("some string")
            .filter(str => str.startsWith('s'))
            .map(str => {
                mapWasCalled = true;
                return str.split(' ')
                    .map(chunk => chunk.toUpperCase())
                    .join('+');
            });

        expect(mapWasCalled).to.be.true;
        expect(result.get()).to.be.deep.equal("SOME+STRING");
    });

    it("should return None and not apply 'map' function in case of unsuccessfull 'filter'",function() {
        let mapWasCalled = false;

        const result = Option("some string")
            .filter(str => str.startsWith('a'))
            .map(str => {
                mapWasCalled = true;
                return str.split(' ')
                    .map(chunk => chunk.toUpperCase())
                    .join('+');
            });

        expect(mapWasCalled).to.be.false;
        expect(result).to.be.instanceof(None);
        expect(() => result.get()).to.throw(Error);
    });

    it("should flatten the inner value in case of using 'flatMap'", function() {
        let filterWasCalled = false;

        const result = Option([1, 2, 3, 4])
            .filter(arr => Array.isArray(arr))
            .flatMap(arr => {
                const num = arr.filter(num => num === 3).pop();
                filterWasCalled = true;
                return Option(num);
            });

        expect(filterWasCalled).to.be.true;
        expect(result.get()).to.not.be.instanceof(Option);
        expect(result.get()).to.be.deep.equal(3);
    });

    it("should not call 'filter' function if used on None, 'orElse' should present a non-empty Option to substitute", function() {
        let filterWasCalled = false;

        const result = Option("foo", "foo")
            .filter(val => {
                filterWasCalled = true;
                return true;
            })
            .orElse(Option("other string"))
            .orElse(Option(null));

        expect(filterWasCalled).to.be.false;
        expect(result.isDefined()).to.be.true;
        expect(result.get()).to.be.deep.equal("other string");
    });

    it("should correctly build Option from a function return", function() {
        let initialFuncCalled = false;

        const result = Option.fromReturn(() => {
                initialFuncCalled = true;
                return [1, 2, 3];
            })
            .filter(arr => Array.isArray(arr))
            .map(arr => {
                return arr.reduce((acc, num) => { return acc + num }, 0);
            })
            .getOrElse(0);

        expect(initialFuncCalled).to.be.true;
        expect(result).to.be.deep.equal(6);
    });

    it("should correctly handle None cases when delegating to it's iterator", function() {
        let list = [
                Option(1),
                Option(2),
                Option(),
                Option(3),
                Option(),
                Option()
            ],
            delegatingGenerator = function*() {
                for (let i = 0; i < list.length; i++) {
                    yield *list[i]; // Delegating call to Options default iterator
                }
            },
            output = [];

        for (let val of delegatingGenerator()) {
            output.push(val);
        }

        expect(output).to.be.deep.equal([1, 2, 3]);
    });

    it("should have 100% interface compatibility with 'LazyOption' type", function() {
        const lazyOption = LazyOption.create(v => Option(v, null), 42);
        const result = Option(1)
            .map(v => v + 1)
            .filterNot(v => v === 2)
            .orElse(lazyOption)
            .filter(v => v === 42)
            .getOrElse(0);

        expect(result).to.be.equal(42);
    });
});
