// Source: https://github.com/esdoc/esdoc/issues/532#issuecomment-670843906
module.exports = {
  onHandleCode(event) {
    // remove any optional chaining use from the incoming doc
    event.data.code = event.data.code.replace(/\w+\?\.\b/g, substr => {
      return substr.replace(/\?/g, '')
    })
  },
}
