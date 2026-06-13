export function register() {
  // Intercept Headers.set and Headers.append before undici throws, so we
  // get the exact header name + value + stack trace instead of a bare error.
  const origSet = Headers.prototype.set
  const origAppend = Headers.prototype.append

  function scan(op: string, name: string, value: string) {
    const src = name + ': ' + value
    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) > 255) {
        console.error(
          `[BYTESTRING] ${op} | header="${name}" badIdx=${i} char="${value[i]}" code=${value.charCodeAt(i)} | value="${value.slice(0, 60)}"\n` +
          new Error('stack').stack,
        )
        break
      }
    }
    for (let i = 0; i < name.length; i++) {
      if (name.charCodeAt(i) > 255) {
        console.error(
          `[BYTESTRING] ${op} | headerName at idx=${i} char="${name[i]}" code=${name.charCodeAt(i)} | name="${name.slice(0, 60)}"\n` +
          new Error('stack').stack,
        )
        break
      }
    }
  }

  Headers.prototype.set = function (name: string, value: string) {
    scan('set', name, value)
    return origSet.call(this, name, value)
  }

  Headers.prototype.append = function (name: string, value: string) {
    scan('append', name, value)
    return origAppend.call(this, name, value)
  }
}
