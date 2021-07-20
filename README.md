# SuperWSTest

Extends [supertest](https://github.com/visionmedia/supertest) with
WebSocket capabilities. This is intended for testing servers which
support both HTTP and WebSocket requests.

## Install dependency

```bash
npm install --save-dev superwstest
```

## Usage

### Example server implementation

```javascript
import http from 'http';
import WebSocket from 'ws';

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.on('message', (message) => { ws.send(`echo ${message}`); });
  ws.send('hello');
});

export default server;
```

### Tests for example server

```javascript
import request from 'superwstest';
import server from './myServer';

describe('My Server', () => {
  beforeEach((done) => {
    server.listen(0, 'localhost', done);
  });

  afterEach((done) => {
    server.close(done);
  });

  it('communicates via websockets', async () => {
    await request(server)
      .ws('/path/ws')
      .expectText('hello')
      .sendText('foo')
      .expectText('echo foo')
      .sendText('abc')
      .expectText('echo abc')
      .close()
      .expectClosed();
  });
});
```

Since this builds on supertest, all the HTTP checks are also available.

As long as you add `server.close` in an `afterEach`, all connections
will be closed automatically, so you do not need to close connections
in every test.

### Testing a remote webserver

You can also test against a remote webserver by specifying the URL
of the server:

```javascript
import request from 'superwstest';

describe('My Remote Server', () => {
  afterEach(() => {
    request.closeAll(); // recommended when using remote servers
  });

  it('communicates via websockets', async () => {
    await request('https://example.com')
      .ws('/path/ws')
      .expectText('hello')
      .close();
  });
});
```

Note that adding `request.closeAll()` to an `afterEach` will
ensure connections are closed in all situations (including test
timeouts, etc.). This is not needed when testing against a local
server because the server will close connections when closed.

The server URL given should be http(s) rather than ws(s); this will
provide compatibility with native supertest requests such as `post`,
`get`, etc. and will be converted automatically as needed.

## API

- [request(server[, options])](#requestserver-options)
- [request(...).ws(path[, protocols][, options])](#requestserverwspath-protocols-options)
  - [.expectText([expected][, opts])](#expecttextexpected)
  - [.expectJson([expected][, opts])](#expectjsonexpected)
  - [.expectBinary([expected][, opts])](#expectbinaryexpected)
  - [.sendText(text)](#sendtexttext)
  - [.sendJson(json)](#sendjsonjson)
  - [.sendBinary(data)](#sendbinarydata)
  - [.send(data[, options])](#senddata-options)
  - [.close([code[, reason]]](#closecode-reason)
  - [.expectClosed([expectedCode[, expectedReason]])](#expectclosedexpectedcode-expectedreason)
  - [.expectConnectionError([expectedStatusCode])](#expectconnectionerrorexpectedstatuscode)
  - [.expectUpgrade(test)](#expectupgradetest)
  - [.wait(milliseconds)](#waitmilliseconds)
  - [.exec(fn)](#execfn)

### `request(server[, options])`

The beginning of a superwstest
(or [supertest](https://www.npmjs.com/package/supertest)) test chain.
Typically this is immediately followed by `.ws(...)` or `.get(...)` etc.

`options` can contain additional configuration:

- `shutdownDelay`: wait up to the given number of milliseconds for
  connections to close by themselves before forcing a shutdown when
  `close` is called on the server. By default this is 0 (i.e. all
  connections are closed immediately). Has no effect when testing
  remote servers.

  ```javascript
  request(server, { shutdownDelay: 500 }).ws(path)
  ```

### `request(server).ws(path[, protocols][, options])`

Returns a `Promise` (eventually returning the `WebSocket`) with
additional fluent API methods attached (described below).

Internally, this uses [ws](https://www.npmjs.com/package/ws), and the
protocols and options given are passed directly to the
[`WebSocket` constructor](https://github.com/websockets/ws/blob/HEAD/doc/ws.md#new-websocketaddress-protocols-options).
For example, to set a cookie:

```javascript
request(myServer)
  .ws('/path/ws', { headers: { cookie: 'foo=bar' } })
```

### `.expectText([expected][, opts])`

Waits for the next message to arrive then checks that it matches the given
text (exact match), regular expression, or function. If no parameter is
given, this only checks that the message is text (not binary).

```javascript
request(server).ws('...')
  .expectText('hello')   // exact text
  .expectText(/^hel*o$/) // RegExp matching
  .expectText((actual) => actual.includes('lo')) // function
  .expectText()          // just check message is text
  .expectText('hello', {timeout:500})   // must arrive within 500ms
```

When using a function, the check will be considered a failure if it
returns `false`. Any other value (including `undefined` and `null`)
is considered a pass. This means you can use (e.g.) Jest expectations
(returning no value):

```javascript
request(server).ws('...')
  .expectText((actual) => {
    expect(actual).toContain('foo');
  })
```

The `opts` parameter is an optional object containing additional options:
 * `timeout` (Number) - the number of milliseconds that the message is
   expected to arrive within. Try to avoid using it, unless really necessary
   as it may cause intermittent failures in tests due to timing variations.

### `.expectJson([expected][, opts])`

Waits for the next message to arrive, deserialises it using `JSON.parse`,
then checks that it matches the given data (deep equality) or function.
If no parameter is given, this only checks that the message is valid JSON.

```javascript
request(server).ws('...')
  .expectJson({ foo: 'bar', zig: ['zag'] })       // exact match
  .expectJson((actual) => (actual.foo === 'bar')) // function
  .expectJson() // just check message is valid JSON
  .expectJson({ foo: 'bar', zig: ['zag'] }, {timeout:500})   // must arrive within 500ms
```

When using a function, the check will be considered a failure if it
returns `false`. Any other value (including `undefined` and `null`)
is considered a pass. This means you can use (e.g.) Jest expectations
(returning no value):

```javascript
request(server).ws('...')
  .expectText((actual) => {
    expect(actual.bar).toBeGreaterThan(2);
  })
```

The `opts` parameter is an optional object containing additional options.
See `.expectText()` for a description of the available options.

### `.expectBinary([expected][, opts])`

Waits for the next message to arrive then checks that it matches the given
array / buffer (exact match) or function. If no parameter is given,
this only checks that the message is binary (not text).

When providing a function, the data will always be a `Uint8Array`.

```javascript
request(server).ws('...')
  .expectBinary([10, 20, 30])
  .expectBinary(new Uint8Array([10, 20, 30]))
  .expectBinary((actual) => (actual[0] === 10)) // function
  .expectBinary() // just check message is binary
  .expectBinary(new Uint8Array([10, 20, 30]), {timeout:500})   // must arrive within 500ms
```

When using a function, the check will be considered a failure if it
returns `false`. Any other value (including `undefined` and `null`)
is considered a pass. This means you can use (e.g.) Jest expectations
(returning no value):

```javascript
request(server).ws('...')
  .expectBinary((actual) => {
    expect(actual[0]).toBeGreaterThan(2);
  })
```

The `opts` parameter is an optional object containing additional options.
See `.expectText()` for a description of the available options.

### `.sendText(text)`

Sends the given text. Non-strings are converted using `String` before
sending.

```javascript
request(server).ws('...')
  .sendText('yo')
```

### `.sendJson(json)`

Sends the given JSON as text using `JSON.stringify`.

```javascript
request(server).ws('...')
  .sendJson({ foo: 'bar' })
```

### `.sendBinary(data)`

Sends the given data as a binary message.

```javascript
request(server).ws('...')
  .sendBinary([10, 20, 30])
  .sendBinary(new Uint8Array([10, 20, 30]))
```

### `.send(data[, options])`

Sends a raw message (accepts any types accepted by
[`WebSocket.send`](https://github.com/websockets/ws/blob/HEAD/doc/ws.md#websocketsenddata-options-callback),
and `options` is passed through unchanged).

```javascript
request(server).ws('...')
  .send(new Uint8Array([5, 20, 100])) // binary message

  // multipart message
  .send('this is a fragm', { fin: false })
  .send('ented message', { fin: true })
```

### `.close([code[, reason]])`

Closes the socket. Arguments are passed directly to
[`WebSocket.close`](https://github.com/websockets/ws/blob/HEAD/doc/ws.md#websocketclosecode-reason).

```javascript
request(server).ws('...')
  .close() // close with default code and reason

request(server).ws('...')
  .close(1001) // custom code

request(server).ws('...')
  .close(1001, 'getting a cup of tea') // custom code and reason
```

### `.expectClosed([expectedCode[, expectedReason]])`

Waits for the socket to be closed. Optionally checks if it was closed
with the expected code and reason.

```javascript
request(server).ws('...')
  .expectClosed()

request(server).ws('...')
  .expectClosed(1001) // expected code

request(server).ws('...')
  .expectClosed(1001, 'bye') // expected code and reason
```

### `.expectConnectionError([expectedStatusCode])`

Expect the initial connection handshake to fail. Optionally checks for
a specific HTTP status code.

*note: if you use this, it must be the only invocation in the chain*

```javascript
request(server).ws('...')
  .expectConnectionError(); // any error

request(server).ws('...')
  .expectConnectionError(404); // specific error
```

### `.expectUpgrade(test)`

Run a check against the Upgrade response. Useful for making arbitrary
assertions about parts of the Upgrade response, such as headers.

The check will be considered a failure if it returns `false`. Any other
value (including `undefined` and `null`) is considered a pass.
This means you can use (e.g.) Jest expectations (returning no value).

The parameter will be a
[`http.IncomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage).

```javascript
request(server).ws('...')
  .expectUpgrade((res) => (res.headers['set-cookie'] === 'foo=bar'));

request(server).ws('...')
  .expectUpgrade((res) => {
    expect(res.headers).toHaveProperty('set-cookie', 'foo=bar');
  })
```

### `.wait(milliseconds)`

Adds a delay of a number of milliseconds using `setTimeout`. This is
available as an escape hatch, but try to avoid using it, as it may
cause intermittent failures in tests due to timing variations.

```javascript
request(server).ws('...')
  .wait(500)
```

### `.exec(fn)`

Invokes the given function. If the function returns a promise, this
waits for the promise to resolve (but ignores the result). The function
will be given the WebSocket as a parameter. This is available as an
escape hatch if the standard functions do not meet your needs.

```javascript
request(server).ws('...')
  .exec((ws) => console.log('hello debugger!'))
```

*note: this differs from `Promise.then` because you can continue to
chain web socket actions and expectations.*
