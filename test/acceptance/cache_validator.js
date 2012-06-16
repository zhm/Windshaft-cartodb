var assert      = require('assert');
var net = require('net');
require(__dirname + '/../test_helper');
var CacheValidator = require(__dirname + '/../../lib/cartodb/cache_validator');
var tests = module.exports = {};

function VarnishEmu(on_cmd_recieved) {
    var self = this;
    var welcome_msg = 'hi, im a varnish emu, right?';

    self.commands_recieved = [];

    var server = net.createServer(function (socket) {
      var command = '';
      socket.write("200 " + welcome_msg.length + "\n");
      socket.write(welcome_msg);
      socket.on('data', function(data) {
        self.commands_recieved.push(data);
        on_cmd_recieved && on_cmd_recieved(self.commands_recieved);
        socket.write('200 0\n');
      });
    });
    server.listen(1337, "127.0.0.1");
}

tests['working'] = function() { assert.ok(true); };

tests['should call purge on varnish when invalidate database'] = function() {
    var varnish = new VarnishEmu(function(cmds) {
        assert.ok(cmds.length == 1);
        assert.equal('purge obj.http.X-Cache-Channel == test_db:test_cache\n', cmds[0]);
    });
    CacheValidator.init('localhost', 1337);
    CacheValidator.invalidate_db('test_db', 'test_cache');
}
