/* SmtpJS.com - v3.0.0 */
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
var Email = {
  send: function (a) {
    return new Promise(function (n, e) {
      ;(a.nocache = Math.floor(1e6 * Math.random() + 1)), (a.Action = 'Send')
      var t = JSON.stringify(a)
      Email.ajaxPost('https://smtpjs.com/v3/smtpjs.aspx?', t, function (e) {
        n(e)
      })
    })
  },
  ajaxPost: function (e, n, t) {
    var a = Email.createCORSRequest('POST', e)
    a.setRequestHeader('Content-type', 'application/x-www-form-urlencoded'),
    (a.onload = function () {
      var e = a.responseText
      t != null && t(e)
    }),
    a.send(n)
  },
  ajax: function (e, n) {
    var t = Email.createCORSRequest('GET', e)
    ;(t.onload = function () {
      var e = t.responseText
      n != null && n(e)
    }),
    t.send()
  },
  createCORSRequest: function (e, n) {
    var t = new XMLHttpRequest()
    return (
      'withCredentials' in t
        ? t.open(e, n, !0)
        : typeof XDomainRequest !== 'undefined'
          ? (t = new XDomainRequest()).open(e, n)
          : (t = null),
      t
    )
  }
}

module.exports = { Email }
