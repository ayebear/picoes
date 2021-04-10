import { invoke, shallowClone } from './utilities'

test('utilities: invoke', () => {
  const obj = {
    foo1: () => 'bar',
    foo2: 'bar',
    foo3: (...args) => args.join(' '),
  }
  class C {
    constructor() {
      this.that = this
      this.foo5 = () => {
        return Boolean(this.that && this === this.that)
      }
    }
    foo4() {
      return Boolean(this.that && this === this.that)
    }
  }
  const obj2 = new C()
  expect(invoke(obj, 'foo1')).toBe('bar')
  expect(invoke(obj, 'foo2')).toBe(undefined)
  expect(invoke(obj, 'foo3', 'foo', 'bar')).toBe('foo bar')
  expect(invoke(obj2, 'foo4')).toBe(true)
  expect(obj2.foo4()).toBe(true)
  expect(obj2.foo4.call(this)).toBe(false)
  expect(invoke(obj2, 'foo5')).toBe(true)
  expect(obj2.foo5()).toBe(true)
  expect(obj2.foo5.call(this)).toBe(true)
})

test('utilities: shallowClone', () => {
  const obj = { a: 1, b: 2 }
  const arr = [1, 2, { c: 3 }, { d: 4 }]
  const obj2 = shallowClone(obj)
  const arr2 = shallowClone(arr)
  expect(obj).toEqual(obj2)
  expect(arr).toEqual(arr2)
  obj.a = 0
  obj2.a = -1
  arr[0] = 0
  arr[2] = 3
  expect(obj.a).toBe(0)
  expect(obj2.a).toBe(-1)
  expect(arr).toEqual([0, 2, 3, { d: 4 }])
  expect(arr2).toEqual([1, 2, { c: 3 }, { d: 4 }])
  arr[3].d = 10
  expect(arr).toEqual([0, 2, 3, { d: 10 }])
  expect(arr2).toEqual([1, 2, { c: 3 }, { d: 10 }])
})
