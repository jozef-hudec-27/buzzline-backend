import app from '../app.js'
import debug from 'debug'
import http from 'http'
import socketConfig from '../socket-config.js'

const debug_ = debug('express-ts:server')

const port = normalizePort(process.env.PORT || '3000')
app.set('port', port)

const server = http.createServer(app)

socketConfig(server)

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

function normalizePort(val: string) {
  const port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

function onError(error: any) {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

function onListening() {
  const addr = server.address()
  //   @ts-ignore
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
  debug_('Listening on ' + bind)
}
