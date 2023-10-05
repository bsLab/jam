/*******************************************************************************
                                      CONFIG
*******************************************************************************/

// Config
var config = {
  warnings: false
};

/*******************************************************************************
                                  ACTIVATION FUNCTIONS
*******************************************************************************/

// https://en.wikipedia.org/wiki/Activation_function
// https://stats.stackexchange.com/questions/115258/comprehensive-list-of-activation-functions-in-neural-networks-with-pros-cons
var activation = {
  LOGISTIC: function LOGISTIC (x, derivate) {
    var fx = 1 / (1 + Math.exp(-x));
    if (!derivate) return fx;
    return fx * (1 - fx);
  },
  TANH: function TANH (x, derivate) {
    if (derivate) return 1 - Math.pow(Math.tanh(x), 2);
    return Math.tanh(x);
  },
  IDENTITY: function IDENTITY (x, derivate) {
    return derivate ? 1 : x;
  },
  STEP: function STEP (x, derivate) {
    return derivate ? 0 : x > 0 ? 1 : 0;
  },
  RELU: function RELU (x, derivate) {
    if (derivate) return x > 0 ? 1 : 0;
    return x > 0 ? x : 0;
  },
  SOFTSIGN: function SOFTSIGN (x, derivate) {
    var d = 1 + Math.abs(x);
    if (derivate) return x / Math.pow(d, 2);
    return x / d;
  },
  SINUSOID: function SINUSOID (x, derivate) {
    if (derivate) return Math.cos(x);
    return Math.sin(x);
  },
  GAUSSIAN: function GAUSSIAN (x, derivate) {
    var d = Math.exp(-Math.pow(x, 2));
    if (derivate) return -2 * x * d;
    return d;
  },
  BENT_IDENTITY: function BENT_IDENTITY (x, derivate) {
    var d = Math.sqrt(Math.pow(x, 2) + 1);
    if (derivate) return x / (2 * d) + 1;
    return (d - 1) / 2 + x;
  },
  BIPOLAR: function BIPOLAR (x, derivate) {
    return derivate ? 0 : x > 0 ? 1 : -1;
  },
  BIPOLAR_SIGMOID: function BIPOLAR_SIGMOID (x, derivate) {
    var d = 2 / (1 + Math.exp(-x)) - 1;
    if (derivate) return 1 / 2 * (1 + d) * (1 - d);
    return d;
  },
  HARD_TANH: function HARD_TANH (x, derivate) {
    if (derivate) return x > -1 && x < 1 ? 1 : 0;
    return Math.max(-1, Math.min(1, x));
  },
  ABSOLUTE: function ABSOLUTE (x, derivate) {
    if (derivate) return x < 0 ? -1 : 1;
    return Math.abs(x);
  },
  INVERSE: function INVERSE (x, derivate) {
    if (derivate) return -1;
    return 1 - x;
  },
  // https://arxiv.org/pdf/1706.02515.pdf
  SELU: function SELU (x, derivate) {
    var alpha = 1.6732632423543772848170429916717;
    var scale = 1.0507009873554804934193349852946;
    var fx = x > 0 ? x : alpha * Math.exp(x) - alpha;
    if (derivate) { return x > 0 ? scale : (fx + alpha) * scale; }
    return fx * scale;
  }
};

/*******************************************************************************
                                      MUTATION
*******************************************************************************/

// https://en.wikipedia.org/wiki/mutation_(genetic_algorithm)
var mutation = {
  ADD_NODE: {
    name: 'ADD_NODE'
  },
  SUB_NODE: {
    name: 'SUB_NODE',
    keep_gates: true
  },
  ADD_CONN: {
    name: 'ADD_CONN'
  },
  SUB_CONN: {
    name: 'REMOVE_CONN'
  },
  MOD_WEIGHT: {
    name: 'MOD_WEIGHT',
    min: -1,
    max: 1
  },
  MOD_BIAS: {
    name: 'MOD_BIAS',
    min: -1,
    max: 1
  },
  MOD_ACTIVATION: {
    name: 'MOD_ACTIVATION',
    mutateOutput: true,
    allowed: [
      activation.LOGISTIC,
      activation.TANH,
      activation.RELU,
      activation.IDENTITY,
      activation.STEP,
      activation.SOFTSIGN,
      activation.SINUSOID,
      activation.GAUSSIAN,
      activation.BENT_IDENTITY,
      activation.BIPOLAR,
      activation.BIPOLAR_SIGMOID,
      activation.HARD_TANH,
      activation.ABSOLUTE,
      activation.INVERSE,
      activation.SELU
    ]
  },
  ADD_SELF_CONN: {
    name: 'ADD_SELF_CONN'
  },
  SUB_SELF_CONN: {
    name: 'SUB_SELF_CONN'
  },
  ADD_GATE: {
    name: 'ADD_GATE'
  },
  SUB_GATE: {
    name: 'SUB_GATE'
  },
  ADD_BACK_CONN: {
    name: 'ADD_BACK_CONN'
  },
  SUB_BACK_CONN: {
    name: 'SUB_BACK_CONN'
  },
  SWAP_NODES: {
    name: 'SWAP_NODES',
    mutateOutput: true
  }
};

mutation.ALL = [
  mutation.ADD_NODE,
  mutation.SUB_NODE,
  mutation.ADD_CONN,
  mutation.SUB_CONN,
  mutation.MOD_WEIGHT,
  mutation.MOD_BIAS,
  mutation.MOD_ACTIVATION,
  mutation.ADD_GATE,
  mutation.SUB_GATE,
  mutation.ADD_SELF_CONN,
  mutation.SUB_SELF_CONN,
  mutation.ADD_BACK_CONN,
  mutation.SUB_BACK_CONN,
  mutation.SWAP_NODES
];

mutation.FFW = [
  mutation.ADD_NODE,
  mutation.SUB_NODE,
  mutation.ADD_CONN,
  mutation.SUB_CONN,
  mutation.MOD_WEIGHT,
  mutation.MOD_BIAS,
  mutation.MOD_ACTIVATION,
  mutation.SWAP_NODES
];

/*******************************************************************************
                                      SELECTION
*******************************************************************************/

// https://en.wikipedia.org/wiki/Selection_(genetic_algorithm)

var selection = {
  FITNESS_PROPORTIONATE: {
    name: 'FITNESS_PROPORTIONATE'
  },
  POWER: {
    name: 'POWER',
    power: 4
  },
  TOURNAMENT: {
    name: 'TOURNAMENT',
    size: 5,
    probability: 0.5
  }
};

/*******************************************************************************
                                      CROSSOVER
*******************************************************************************/

// https://en.wikipedia.org/wiki/Crossover_(genetic_algorithm)
var crossover = {
  SINGLE_POINT: {
    name: 'SINGLE_POINT',
    config: [0.4]
  },
  TWO_POINT: {
    name: 'TWO_POINT',
    config: [0.4, 0.9]
  },
  UNIFORM: {
    name: 'UNIFORM'
  },
  AVERAGE: {
    name: 'AVERAGE'
  }
};

/*******************************************************************************
                                    COST FUNCTIONS
*******************************************************************************/

// https://en.wikipedia.org/wiki/Loss_function
var cost = {
  // Cross entropy error
  CROSS_ENTROPY: function (target, output) {
    var error = 0;
    for (var i = 0; i < output.length; i++) {
      // Avoid negative and zero numbers, use 1e-15 http://bit.ly/2p5W29A
      error -= target[i] * Math.log(Math.max(output[i], 1e-15)) + (1 - target[i]) * Math.log(1 - Math.max(output[i], 1e-15));
    }
    return error / output.length;
  },
  // Mean Squared Error
  MSE: function (target, output) {
    var error = 0;
    for (var i = 0; i < output.length; i++) {
      error += Math.pow(target[i] - output[i], 2);
    }

    return error / output.length;
  },
  // Binary error
  BINARY: function (target, output) {
    var misses = 0;
    for (var i = 0; i < output.length; i++) {
      misses += Math.round(target[i] * 2) !== Math.round(output[i] * 2);
    }

    return misses;
  },
  // Mean Absolute Error
  MAE: function (target, output) {
    var error = 0;
    for (var i = 0; i < output.length; i++) {
      error += Math.abs(target[i] - output[i]);
    }

    return error / output.length;
  },
  // Mean Absolute Percentage Error
  MAPE: function (target, output) {
    var error = 0;
    for (var i = 0; i < output.length; i++) {
      error += Math.abs((output[i] - target[i]) / Math.max(target[i], 1e-15));
    }

    return error / output.length;
  },
  // Mean Squared Logarithmic Error
  MSLE: function (target, output) {
    var error = 0;
    for (var i = 0; i < output.length; i++) {
      error += Math.log(Math.max(target[i], 1e-15)) - Math.log(Math.max(output[i], 1e-15));
    }

    return error;
  },
  // Hinge loss, for classifiers
  HINGE: function (target, output) {
    var error = 0;
    for (var i = 0; i < output.length; i++) {
      error += Math.max(0, 1 - target[i] * output[i]);
    }

    return error;
  }
};


/*******************************************************************************
                                    GATING
*******************************************************************************/

// Specifies how to gate a connection between two groups of multiple neurons
var gating = {
  OUTPUT: {
    name: 'OUTPUT'
  },
  INPUT: {
    name: 'INPUT'
  },
  SELF: {
    name: 'SELF'
  }
};


/*******************************************************************************
                                    CONNECTION
*******************************************************************************/

// Specifies in what manner two groups are connected
var connection = {
  ALL_TO_ALL: {
    name: 'OUTPUT'
  },
  ALL_TO_ELSE: {
    name: 'INPUT'
  },
  ONE_TO_ONE: {
    name: 'SELF'
  }
};


/*******************************************************************************
                                      RATE
*******************************************************************************/

// https://stackoverflow.com/questions/30033096/what-is-lr-policy-in-caffe/30045244
var rate = {
  FIXED: function () {
    var func = function (baseRate, iteration) { return baseRate; };
    return func;
  },
  STEP: function (gamma, stepSize) {
    gamma = gamma || 0.9;
    stepSize = stepSize || 100;

    var func = function (baseRate, iteration) {
      return baseRate * Math.pow(gamma, Math.floor(iteration / stepSize));
    };

    return func;
  },
  EXP: function (gamma) {
    gamma = gamma || 0.999;

    var func = function (baseRate, iteration) {
      return baseRate * Math.pow(gamma, iteration);
    };

    return func;
  },
  INV: function (gamma, power) {
    gamma = gamma || 0.001;
    power = power || 2;

    var func = function (baseRate, iteration) {
      return baseRate * Math.pow(1 + gamma * iteration, -power);
    };

    return func;
  }
};

/*******************************************************************************
                                  METHODS
*******************************************************************************/

var methods = {
  activation: activation,
  mutation: mutation,
  selection: selection,
  crossover: crossover,
  cost: cost,
  gating: gating,
  connection: connection,
  rate: rate
};

/*******************************************************************************
                                      CONNECTION
*******************************************************************************/

function Connection (from, to, weight) {
  this.from = from;
  this.to = to;
  this.gain = 1;

  this.weight = (typeof weight === 'undefined') ? Math.random() * 0.2 - 0.1 : weight;

  this.gater = null;
  this.elegibility = 0;

  // For tracking momentum
  this.previousDeltaWeight = 0;

  // Batch training
  this.totalDeltaWeight = 0;

  this.xtrace = {
    nodes: [],
    values: []
  };
}

Connection.prototype = {
  /**
   * Converts the connection to a json object
   */
  toJSON: function () {
    var json = {
      weight: this.weight
    };

    return json;
  }
};

/**
 * Returns an innovation ID
 * https://en.wikipedia.org/wiki/Pairing_function (Cantor pairing function)
 */
Connection.innovationID = function (a, b) {
  return 1 / 2 * (a + b) * (a + b + 1) + b;
};

/*******************************************************************************
                                 NETWORK
*******************************************************************************/


/* Easier variable naming */
var mutation = methods.mutation;

function Network (input, output) {
  if (typeof input === 'undefined' || typeof output === 'undefined') {
    throw new Error('No input or output size given');
  }

  this.input = input;
  this.output = output;

  // Store all the node and connection genes
  this.nodes = []; // Stored in activation order
  this.connections = [];
  this.gates = [];
  this.selfconns = [];

  // Regularization
  this.dropout = 0;

  // Create input and output nodes
  var i;
  for (i = 0; i < this.input + this.output; i++) {
    var type = i < this.input ? 'input' : 'output';
    this.nodes.push(new Node(type));
  }

  // Connect input nodes with output nodes directly
  for (i = 0; i < this.input; i++) {
    for (var j = this.input; j < this.output + this.input; j++) {
      // https://stats.stackexchange.com/a/248040/147931
      var weight = Math.random() * this.input * Math.sqrt(2 / this.input);
      this.connect(this.nodes[i], this.nodes[j], weight);
    }
  }
}

Network.prototype = {
  /**
   * Activates the network
   */
  activate: function (input, training) {
    var output = [];

    // Activate nodes chronologically
    for (var i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].type === 'input') {
        this.nodes[i].activate(input[i]);
      } else if (this.nodes[i].type === 'output') {
        var activation = this.nodes[i].activate();
        output.push(activation);
      } else {
        if (training) this.nodes[i].mask = Math.random() < this.dropout ? 0 : 1;
        this.nodes[i].activate();
      }
    }

    return output;
  },

  /**
   * Activates the network without calculating elegibility traces and such
   */
  noTraceActivate: function (input) {
    var output = [];

    // Activate nodes chronologically
    for (var i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].type === 'input') {
        this.nodes[i].noTraceActivate(input[i]);
      } else if (this.nodes[i].type === 'output') {
        var activation = this.nodes[i].noTraceActivate();
        output.push(activation);
      } else {
        this.nodes[i].noTraceActivate();
      }
    }

    return output;
  },

  /**
   * Backpropagate the network
   */
  propagate: function (rate, momentum, update, target) {
    if (typeof target === 'undefined' || target.length !== this.output) {
      throw new Error('Output target length should match network output length');
    }

    var targetIndex = target.length;

    // Propagate output nodes
    var i;
    for (i = this.nodes.length - 1; i >= this.nodes.length - this.output; i--) {
      this.nodes[i].propagate(rate, momentum, update, target[--targetIndex]);
    }

    // Propagate hidden and input nodes
    for (i = this.nodes.length - this.output - 1; i >= this.input; i--) {
      this.nodes[i].propagate(rate, momentum, update);
    }
  },

  /**
   * Clear the context of the network
   */
  clear: function () {
    for (var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].clear();
    }
  },

  /**
   * Connects the from node to the to node
   */
  connect: function (from, to, weight) {
    var connections = from.connect(to, weight);

    for (var i = 0; i < connections.length; i++) {
      var connection = connections[i];
      if (from !== to) {
        this.connections.push(connection);
      } else {
        this.selfconns.push(connection);
      }
    }

    return connections;
  },

  /**
   * Disconnects the from node from the to node
   */
  disconnect: function (from, to) {
    // Delete the connection in the network's connection array
    var connections = from === to ? this.selfconns : this.connections;

    for (var i = 0; i < connections.length; i++) {
      var connection = connections[i];
      if (connection.from === from && connection.to === to) {
        if (connection.gater !== null) this.ungate(connection);
        connections.splice(i, 1);
        break;
      }
    }

    // Delete the connection at the sending and receiving neuron
    from.disconnect(to);
  },

  /**
   * Gate a connection with a node
   */
  gate: function (node, connection) {
    if (this.nodes.indexOf(node) === -1) {
      throw new Error('This node is not part of the network!');
    } else if (connection.gater != null) {
      if (config.warnings) console.warn('This connection is already gated!');
      return;
    }
    node.gate(connection);
    this.gates.push(connection);
  },

  /**
   *  Remove the gate of a connection
   */
  ungate: function (connection) {
    var index = this.gates.indexOf(connection);
    if (index === -1) {
      throw new Error('This connection is not gated!');
    }

    this.gates.splice(index, 1);
    connection.gater.ungate(connection);
  },

  /**
   *  Removes a node from the network
   */
  remove: function (node) {
    var index = this.nodes.indexOf(node);

    if (index === -1) {
      throw new Error('This node does not exist in the network!');
    }

    // Keep track of gaters
    var gaters = [];

    // Remove selfconnections from this.selfconns
    this.disconnect(node, node);

    // Get all its inputting nodes
    var inputs = [];
    for (var i = node.connections.in.length - 1; i >= 0; i--) {
      var connection = node.connections.in[i];
      if (mutation.SUB_NODE.keep_gates && connection.gater !== null && connection.gater !== node) {
        gaters.push(connection.gater);
      }
      inputs.push(connection.from);
      this.disconnect(connection.from, node);
    }

    // Get all its outputing nodes
    var outputs = [];
    for (i = node.connections.out.length - 1; i >= 0; i--) {
      var connection = node.connections.out[i];
      if (mutation.SUB_NODE.keep_gates && connection.gater !== null && connection.gater !== node) {
        gaters.push(connection.gater);
      }
      outputs.push(connection.to);
      this.disconnect(node, connection.to);
    }

    // Connect the input nodes to the output nodes (if not already connected)
    var connections = [];
    for (i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      for (var j = 0; j < outputs.length; j++) {
        var output = outputs[j];
        if (!input.isProjectingTo(output)) {
          var conn = this.connect(input, output);
          connections.push(conn[0]);
        }
      }
    }

    // Gate random connections with gaters
    for (i = 0; i < gaters.length; i++) {
      if (connections.length === 0) break;

      var gater = gaters[i];
      var connIndex = Math.floor(Math.random() * connections.length);

      this.gate(gater, connections[connIndex]);
      connections.splice(connIndex, 1);
    }

    // Remove gated connections gated by this node
    for (i = node.connections.gated.length - 1; i >= 0; i--) {
      var conn = node.connections.gated[i];
      this.ungate(conn);
    }

    // Remove selfconnection
    this.disconnect(node, node);

    // Remove the node from this.nodes
    this.nodes.splice(index, 1);
  },

  /**
   * Mutates the network with the given method
   */
  mutate: function (method) {
    if (typeof method === 'undefined') {
      throw new Error('No (correct) mutate method given!');
    }

    var i, j;
    switch (method) {
      case mutation.ADD_NODE:
        // Look for an existing connection and place a node in between
        var connection = this.connections[Math.floor(Math.random() * this.connections.length)];
        var gater = connection.gater;
        this.disconnect(connection.from, connection.to);

        // Insert the new node right before the old connection.to
        var toIndex = this.nodes.indexOf(connection.to);
        var node = new Node('hidden');

        // Random squash function
        node.mutate(mutation.MOD_ACTIVATION);

        // Place it in this.nodes
        var minBound = Math.min(toIndex, this.nodes.length - this.output);
        this.nodes.splice(minBound, 0, node);

        // Now create two new connections
        var newConn1 = this.connect(connection.from, node)[0];
        var newConn2 = this.connect(node, connection.to)[0];

        // Check if the original connection was gated
        if (gater != null) {
          this.gate(gater, Math.random() >= 0.5 ? newConn1 : newConn2);
        }
        break;
      case mutation.SUB_NODE:
        // Check if there are nodes left to remove
        if (this.nodes.length === this.input + this.output) {
          if (config.warnings) console.warn('No more nodes left to remove!');
          break;
        }

        // Select a node which isn't an input or output node
        var index = Math.floor(Math.random() * (this.nodes.length - this.output - this.input) + this.input);
        this.remove(this.nodes[index]);
        break;
      case mutation.ADD_CONN:
        // Create an array of all uncreated (feedforward) connections
        var available = [];
        for (i = 0; i < this.nodes.length - this.output; i++) {
          var node1 = this.nodes[i];
          for (j = Math.max(i + 1, this.input); j < this.nodes.length; j++) {
            var node2 = this.nodes[j];
            if (!node1.isProjectingTo(node2)) available.push([node1, node2]);
          }
        }

        if (available.length === 0) {
          if (config.warnings) console.warn('No more connections to be made!');
          break;
        }

        var pair = available[Math.floor(Math.random() * available.length)];
        this.connect(pair[0], pair[1]);
        break;
      case mutation.SUB_CONN:
        // List of possible connections that can be removed
        var possible = [];

        for (i = 0; i < this.connections.length; i++) {
          var conn = this.connections[i];
          // Check if it is not disabling a node
          if (conn.from.connections.out.length > 1 && conn.to.connections.in.length > 1 && this.nodes.indexOf(conn.to) > this.nodes.indexOf(conn.from)) {
            possible.push(conn);
          }
        }

        if (possible.length === 0) {
          if (config.warnings) console.warn('No connections to remove!');
          break;
        }

        var randomConn = possible[Math.floor(Math.random() * possible.length)];
        this.disconnect(randomConn.from, randomConn.to);
        break;
      case mutation.MOD_WEIGHT:
        var allconnections = this.connections.concat(this.selfconns);

        var connection = allconnections[Math.floor(Math.random() * allconnections.length)];
        var modification = Math.random() * (method.max - method.min) + method.min;
        connection.weight += modification;
        break;
      case mutation.MOD_BIAS:
        // Has no effect on input node, so they are excluded
        var index = Math.floor(Math.random() * (this.nodes.length - this.input) + this.input);
        var node = this.nodes[index];
        node.mutate(method);
        break;
      case mutation.MOD_ACTIVATION:
        // Has no effect on input node, so they are excluded
        if (!method.mutateOutput && this.input + this.output === this.nodes.length) {
          if (config.warnings) console.warn('No nodes that allow mutation of activation function');
          break;
        }

        var index = Math.floor(Math.random() * (this.nodes.length - (method.mutateOutput ? 0 : this.output) - this.input) + this.input);
        var node = this.nodes[index];

        node.mutate(method);
        break;
      case mutation.ADD_SELF_CONN:
        // Check which nodes aren't selfconnected yet
        var possible = [];
        for (i = this.input; i < this.nodes.length; i++) {
          var node = this.nodes[i];
          if (node.connections.self.weight === 0) {
            possible.push(node);
          }
        }

        if (possible.length === 0) {
          if (config.warnings) console.warn('No more self-connections to add!');
          break;
        }

        // Select a random node
        var node = possible[Math.floor(Math.random() * possible.length)];

        // Connect it to himself
        this.connect(node, node);
        break;
      case mutation.SUB_SELF_CONN:
        if (this.selfconns.length === 0) {
          if (config.warnings) console.warn('No more self-connections to remove!');
          break;
        }
        var conn = this.selfconns[Math.floor(Math.random() * this.selfconns.length)];
        this.disconnect(conn.from, conn.to);
        break;
      case mutation.ADD_GATE:
        var allconnections = this.connections.concat(this.selfconns);

        // Create a list of all non-gated connections
        var possible = [];
        for (i = 0; i < allconnections.length; i++) {
          var conn = allconnections[i];
          if (conn.gater === null) {
            possible.push(conn);
          }
        }

        if (possible.length === 0) {
          if (config.warnings) console.warn('No more connections to gate!');
          break;
        }

        // Select a random gater node and connection, can't be gated by input
        var index = Math.floor(Math.random() * (this.nodes.length - this.input) + this.input);
        var node = this.nodes[index];
        var conn = possible[Math.floor(Math.random() * possible.length)];

        // Gate the connection with the node
        this.gate(node, conn);
        break;
      case mutation.SUB_GATE:
        // Select a random gated connection
        if (this.gates.length === 0) {
          if (config.warnings) console.warn('No more connections to ungate!');
          break;
        }

        var index = Math.floor(Math.random() * this.gates.length);
        var gatedconn = this.gates[index];

        this.ungate(gatedconn);
        break;
      case mutation.ADD_BACK_CONN:
        // Create an array of all uncreated (backfed) connections
        var available = [];
        for (i = this.input; i < this.nodes.length; i++) {
          var node1 = this.nodes[i];
          for (j = this.input; j < i; j++) {
            var node2 = this.nodes[j];
            if (!node1.isProjectingTo(node2)) available.push([node1, node2]);
          }
        }

        if (available.length === 0) {
          if (config.warnings) console.warn('No more connections to be made!');
          break;
        }

        var pair = available[Math.floor(Math.random() * available.length)];
        this.connect(pair[0], pair[1]);
        break;
      case mutation.SUB_BACK_CONN:
        // List of possible connections that can be removed
        var possible = [];

        for (i = 0; i < this.connections.length; i++) {
          var conn = this.connections[i];
          // Check if it is not disabling a node
          if (conn.from.connections.out.length > 1 && conn.to.connections.in.length > 1 && this.nodes.indexOf(conn.from) > this.nodes.indexOf(conn.to)) {
            possible.push(conn);
          }
        }

        if (possible.length === 0) {
          if (config.warnings) console.warn('No connections to remove!');
          break;
        }

        var randomConn = possible[Math.floor(Math.random() * possible.length)];
        this.disconnect(randomConn.from, randomConn.to);
        break;
      case mutation.SWAP_NODES:
        // Has no effect on input node, so they are excluded
        if ((method.mutateOutput && this.nodes.length - this.input < 2) ||
          (!method.mutateOutput && this.nodes.length - this.input - this.output < 2)) {
          if (config.warnings) console.warn('No nodes that allow swapping of bias and activation function');
          break;
        }

        var index = Math.floor(Math.random() * (this.nodes.length - (method.mutateOutput ? 0 : this.output) - this.input) + this.input);
        var node1 = this.nodes[index];
        index = Math.floor(Math.random() * (this.nodes.length - (method.mutateOutput ? 0 : this.output) - this.input) + this.input);
        var node2 = this.nodes[index];

        var biasTemp = node1.bias;
        var squashTemp = node1.squash;

        node1.bias = node2.bias;
        node1.squash = node2.squash;
        node2.bias = biasTemp;
        node2.squash = squashTemp;
        break;
    }
  },

  /**
   * Train the given set to this network
   */
  train: function (set, options) {
    if (set[0].input.length !== this.input || set[0].output.length !== this.output) {
      throw new Error('Dataset input/output size should be same as network input/output size!');
    }

    options = options || {};

    // Warning messages
    if (typeof options.rate === 'undefined') {
      if (config.warnings) console.warn('Using default learning rate, please define a rate!');
    }
    if (typeof options.iterations === 'undefined') {
      if (config.warnings) console.warn('No target iterations given, running until error is reached!');
    }

    // Read the options
    var targetError = options.error || 0.05;
    var cost = options.cost || methods.cost.MSE;
    var baseRate = options.rate || 0.3;
    var dropout = options.dropout || 0;
    var momentum = options.momentum || 0;
    var batchSize = options.batchSize || 1; // online learning
    var ratePolicy = options.ratePolicy || methods.rate.FIXED();

    var start = Date.now();

    if (batchSize > set.length) {
      throw new Error('Batch size must be smaller or equal to dataset length!');
    } else if (typeof options.iterations === 'undefined' && typeof options.error === 'undefined') {
      throw new Error('At least one of the following options must be specified: error, iterations');
    } else if (typeof options.error === 'undefined') {
      targetError = -1; // run until iterations
    } else if (typeof options.iterations === 'undefined') {
      options.iterations = 0; // run until target error
    }

    // Save to network
    this.dropout = dropout;

    if (options.crossValidate) {
      var numTrain = Math.ceil((1 - options.crossValidate.testSize) * set.length);
      var trainSet = set.slice(0, numTrain);
      var testSet = set.slice(numTrain);
    }

    // Loops the training process
    var currentRate = baseRate;
    var iteration = 0;
    var error = 1;

    var i, j, x;
    while (error > targetError && (options.iterations === 0 || iteration < options.iterations)) {
      if (options.crossValidate && error <= options.crossValidate.testError) break;

      iteration++;

      // Update the rate
      currentRate = ratePolicy(baseRate, iteration);

      // Checks if cross validation is enabled
      if (options.crossValidate) {
        this._trainSet(trainSet, batchSize, currentRate, momentum, cost);
        if (options.clear) this.clear();
        error = this.test(testSet, cost).error;
        if (options.clear) this.clear();
      } else {
        error = this._trainSet(set, batchSize, currentRate, momentum, cost);
        if (options.clear) this.clear();
      }

      // Checks for options such as scheduled logs and shuffling
      if (options.shuffle) {
        for (j, x, i = set.length; i; j = Math.floor(Math.random() * i), x = set[--i], set[i] = set[j], set[j] = x);
      }

      if (options.log && iteration % options.log === 0) {
        console.log('iteration', iteration, 'error', error, 'rate', currentRate);
      }

      if (options.schedule && iteration % options.schedule.iterations === 0) {
        options.schedule.function({ error: error, iteration: iteration });
      }
    }

    if (options.clear) this.clear();

    if (dropout) {
      for (i = 0; i < this.nodes.length; i++) {
        if (this.nodes[i].type === 'hidden' || this.nodes[i].type === 'constant') {
          this.nodes[i].mask = 1 - this.dropout;
        }
      }
    }

    return {
      error: error,
      iterations: iteration,
      time: Date.now() - start
    };
  },

  /**
   * Performs one training epoch and returns the error
   * private function used in this.train
   */
  _trainSet: function (set, batchSize, currentRate, momentum, costFunction) {
    var errorSum = 0;
    for (var i = 0; i < set.length; i++) {
      var input = set[i].input;
      var target = set[i].output;

      var update = !!((i + 1) % batchSize === 0 || (i + 1) === set.length);

      var output = this.activate(input, true);
      this.propagate(currentRate, momentum, update, target);

      errorSum += costFunction(target, output);
    }
    return errorSum / set.length;
  },

  /**
   * Tests a set and returns the error and elapsed time
   */
  test: function (set, cost) {
    if (cost == undefined) cost = methods.cost.MSE;
    // Check if dropout is enabled, set correct mask
    var i;
    if (this.dropout) {
      for (i = 0; i < this.nodes.length; i++) {
        if (this.nodes[i].type === 'hidden' || this.nodes[i].type === 'constant') {
          this.nodes[i].mask = 1 - this.dropout;
        }
      }
    }

    var error = 0;
    var start = Date.now();

    for (i = 0; i < set.length; i++) {
      var input = set[i].input;
      var target = set[i].output;
      var output = this.noTraceActivate(input);
      error += cost(target, output);
    }

    error /= set.length;

    var results = {
      error: error,
      time: Date.now() - start
    };

    return results;
  },

  /**
   * Creates a json that can be used to create a graph with d3 and webcola
   */
  graph: function (width, height) {
    var input = 0;
    var output = 0;

    var json = {
      nodes: [],
      links: [],
      constraints: [{
        type: 'alignment',
        axis: 'x',
        offsets: []
      }, {
        type: 'alignment',
        axis: 'y',
        offsets: []
      }]
    };

    var i;
    for (i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];

      if (node.type === 'input') {
        if (this.input === 1) {
          json.constraints[0].offsets.push({
            node: i,
            offset: 0
          });
        } else {
          json.constraints[0].offsets.push({
            node: i,
            offset: 0.8 * width / (this.input - 1) * input++
          });
        }
        json.constraints[1].offsets.push({
          node: i,
          offset: 0
        });
      } else if (node.type === 'output') {
        if (this.output === 1) {
          json.constraints[0].offsets.push({
            node: i,
            offset: 0
          });
        } else {
          json.constraints[0].offsets.push({
            node: i,
            offset: 0.8 * width / (this.output - 1) * output++
          });
        }
        json.constraints[1].offsets.push({
          node: i,
          offset: -0.8 * height
        });
      }

      json.nodes.push({
        id: i,
        name: node.type === 'hidden' ? node.squash.name : node.type.toUpperCase(),
        activation: node.activation,
        bias: node.bias
      });
    }

    var connections = this.connections.concat(this.selfconns);
    for (i = 0; i < connections.length; i++) {
      var connection = connections[i];
      if (connection.gater == null) {
        json.links.push({
          source: this.nodes.indexOf(connection.from),
          target: this.nodes.indexOf(connection.to),
          weight: connection.weight
        });
      } else {
        // Add a gater 'node'
        var index = json.nodes.length;
        json.nodes.push({
          id: index,
          activation: connection.gater.activation,
          name: 'GATE'
        });
        json.links.push({
          source: this.nodes.indexOf(connection.from),
          target: index,
          weight: 1 / 2 * connection.weight
        });
        json.links.push({
          source: index,
          target: this.nodes.indexOf(connection.to),
          weight: 1 / 2 * connection.weight
        });
        json.links.push({
          source: this.nodes.indexOf(connection.gater),
          target: index,
          weight: connection.gater.activation,
          gate: true
        });
      }
    }

    return json;
  },

  /**
   * Convert the network to a json object
   */
  toJSON: function () {
    var json = {
      nodes: [],
      connections: [],
      input: this.input,
      output: this.output,
      dropout: this.dropout
    };

    // So we don't have to use expensive .indexOf()
    var i;
    for (i = 0; i < this.nodes.length; i++) {
      this.nodes[i].index = i;
    }

    for (i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      var tojson = node.toJSON();
      tojson.index = i;
      json.nodes.push(tojson);

      if (node.connections.self.weight !== 0) {
        var tojson = node.connections.self.toJSON();
        tojson.from = i;
        tojson.to = i;

        tojson.gater = node.connections.self.gater != null ? node.connections.self.gater.index : null;
        json.connections.push(tojson);
      }
    }

    for (i = 0; i < this.connections.length; i++) {
      var conn = this.connections[i];
      var tojson = conn.toJSON();
      tojson.from = conn.from.index;
      tojson.to = conn.to.index;

      tojson.gater = conn.gater != null ? conn.gater.index : null;

      json.connections.push(tojson);
    }

    return json;
  },

  /**
   * Sets the value of a property for every node in this network
   */
  set: function (values) {
    for (var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].bias = values.bias || this.nodes[i].bias;
      this.nodes[i].squash = values.squash || this.nodes[i].squash;
    }
  },

  /**
   * Evolves the network to reach a lower error on a dataset
   */
  evolve: function (set, options) {
    if (set[0].input.length !== this.input || set[0].output.length !== this.output) {
      throw new Error('Dataset input/output size should be same as network input/output size!');
    }

    // Read the options
    options = options || {};
    var targetError = typeof options.error !== 'undefined' ? options.error : 0.05;
    var growth = typeof options.growth !== 'undefined' ? options.growth : 0.0001;
    var cost = options.cost || methods.cost.MSE;
    var amount = options.amount || 1;


    var start = Date.now();

    if (typeof options.iterations === 'undefined' && typeof options.error === 'undefined') {
      throw new Error('At least one of the following options must be specified: error, iterations');
    } else if (typeof options.error === 'undefined') {
      targetError = -1; // run until iterations
    } else if (typeof options.iterations === 'undefined') {
      options.iterations = 0; // run until target error
    }

    var fitnessFunction;
    {
      // Create the fitness function
      fitnessFunction = function (genome) {
        var score = 0;
        for (var i = 0; i < amount; i++) {
          score -= genome.test(set, cost).error;
        }

        score -= (genome.nodes.length - genome.input - genome.output + genome.connections.length + genome.gates.length) * growth;
        score = isNaN(score) ? -Infinity : score; // this can cause problems with fitness proportionate selection

        return score / amount;
      };
    } 

    // Intialise the NEAT instance
    options.network = this;
    var neat = new Neat(this.input, this.output, fitnessFunction, options);

    var error = -Infinity;
    var bestFitness = -Infinity;
    var bestGenome;

    while (error < -targetError && (options.iterations === 0 || neat.generation < options.iterations)) {
      var fittest = neat.evolve();
      var fitness = fittest.score;
      error = fitness + (fittest.nodes.length - fittest.input - fittest.output + fittest.connections.length + fittest.gates.length) * growth;

      if (fitness > bestFitness) {
        bestFitness = fitness;
        bestGenome = fittest;
      }

      if (options.log && neat.generation % options.log === 0) {
        console.log('iteration', neat.generation, 'fitness', fitness, 'error', -error);
      }

      if (options.schedule && neat.generation % options.schedule.iterations === 0) {
        options.schedule.function({ fitness: fitness, error: -error, iteration: neat.generation });
      }
    }


    if (typeof bestGenome !== 'undefined') {
      this.nodes = bestGenome.nodes;
      this.connections = bestGenome.connections;
      this.selfconns = bestGenome.selfconns;
      this.gates = bestGenome.gates;

      if (options.clear) this.clear();
    }

    return {
      error: -error,
      iterations: neat.generation,
      time: Date.now() - start
    };
  },

  /**
   * Creates a standalone function of the network which can be run without the
   * need of a library
   */
  standalone: function () {
    var present = [];
    var activations = [];
    var states = [];
    var lines = [];
    var functions = [];

    var i;
    for (i = 0; i < this.input; i++) {
      var node = this.nodes[i];
      activations.push(node.activation);
      states.push(node.state);
    }

    lines.push('for(var i = 0; i < input.length; i++) A[i] = input[i];');

    // So we don't have to use expensive .indexOf()
    for (i = 0; i < this.nodes.length; i++) {
      this.nodes[i].index = i;
    }

    for (i = this.input; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      activations.push(node.activation);
      states.push(node.state);

      var functionIndex = present.indexOf(node.squash.name);

      if (functionIndex === -1) {
        functionIndex = present.length;
        present.push(node.squash.name);
        functions.push(node.squash.toString());
      }

      var incoming = [];
      for (var j = 0; j < node.connections.in.length; j++) {
        var conn = node.connections.in[j];
        var computation = "A[" + conn.from.index + "] * " + conn.weight;
        
        if (conn.gater != null) {
          computation += " * A[" + conn.gater.index + "]";
        }

        incoming.push(computation);
      }

      if (node.connections.self.weight) {
        var conn = node.connections.self;
        var computation = "S[" + i + "] * " + conn.weight;

        if (conn.gater != null) {
          computation += " * A[" + conn.gater.index + "]";
        }

        incoming.push(computation);
      }

      var line1 = "S[" + i + "] = " + incoming.join(' + ') + " + " + node.bias + ";";
      var line2 = "A[" + i + "] = F[" + functionIndex + "](S[" + i + "])" + (!node.mask ? ' * ' + node.mask : '') + ";";
      lines.push(line1);
      lines.push(line2);
    }

    var output = [];
    for (i = this.nodes.length - this.output; i < this.nodes.length; i++) {
      output.push("A[" + i + "]");
    }

    output = "return [" + output.join(',') + "];";
    lines.push(output);

    var total = '';
    
    total += "var F = [" + functions.toString() + "];\r\n"; 
    total += "var A = [" + activations.toString() + "];\r\n";
    total += "var S = [" + states.toString() + "];\r\n";
    total += "function activate(input){\r\n" + lines.join('\r\n') + "\r\n}";
    return total;
  },

  /**
   * Serialize to send to workers efficiently
   */
  serialize: function () {
    var activations = [];
    var states = [];
    var conns = [];
    var squashes = [
      'LOGISTIC', 'TANH', 'IDENTITY', 'STEP', 'RELU', 'SOFTSIGN', 'SINUSOID',
      'GAUSSIAN', 'BENT_IDENTITY', 'BIPOLAR', 'BIPOLAR_SIGMOID', 'HARD_TANH',
      'ABSOLUTE', 'INVERSE', 'SELU'
    ];

    conns.push(this.input);
    conns.push(this.output);

    var i;
    for (i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      node.index = i;
      activations.push(node.activation);
      states.push(node.state);
    }

    for (i = this.input; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      conns.push(node.index);
      conns.push(node.bias);
      conns.push(squashes.indexOf(node.squash.name));

      conns.push(node.connections.self.weight);
      conns.push(node.connections.self.gater == null ? -1 : node.connections.self.gater.index);

      for (var j = 0; j < node.connections.in.length; j++) {
        var conn = node.connections.in[j];

        conns.push(conn.from.index);
        conns.push(conn.weight);
        conns.push(conn.gater == null ? -1 : conn.gater.index);
      }

      conns.push(-2); // stop token -> next node
    }

    return [activations, states, conns];
  }
};

/**
 * Convert a json object to a network
 */
Network.fromJSON = function (json) {
  var network = new Network(json.input, json.output);
  network.dropout = json.dropout;
  network.nodes = [];
  network.connections = [];

  var i;
  for (i = 0; i < json.nodes.length; i++) {
    network.nodes.push(Node.fromJSON(json.nodes[i]));
  }

  for (i = 0; i < json.connections.length; i++) {
    var conn = json.connections[i];

    var connection = network.connect(network.nodes[conn.from], network.nodes[conn.to])[0];
    connection.weight = conn.weight;

    if (conn.gater != null) {
      network.gate(network.nodes[conn.gater], connection);
    }
  }

  return network;
};

/**
 * Merge two networks into one
 */
Network.merge = function (network1, network2) {
  // Create a copy of the networks
  network1 = Network.fromJSON(network1.toJSON());
  network2 = Network.fromJSON(network2.toJSON());

  // Check if output and input size are the same
  if (network1.output !== network2.input) {
    throw new Error('Output size of network1 should be the same as the input size of network2!');
  }

  // Redirect all connections from network2 input from network1 output
  var i;
  for (i = 0; i < network2.connections.length; i++) {
    var conn = network2.connections[i];
    if (conn.from.type === 'input') {
      var index = network2.nodes.indexOf(conn.from);

      // redirect
      conn.from = network1.nodes[network1.nodes.length - 1 - index];
    }
  }

  // Delete input nodes of network2
  for (i = network2.input - 1; i >= 0; i--) {
    network2.nodes.splice(i, 1);
  }

  // Change the node type of network1's output nodes (now hidden)
  for (i = network1.nodes.length - network1.output; i < network1.nodes.length; i++) {
    network1.nodes[i].type = 'hidden';
  }

  // Create one network from both networks
  network1.connections = network1.connections.concat(network2.connections);
  network1.nodes = network1.nodes.concat(network2.nodes);

  return network1;
};

/**
 * Create an offspring from two parent networks
 */
Network.crossOver = function (network1, network2, equal) {
  if (network1.input !== network2.input || network1.output !== network2.output) {
    throw new Error("Networks don't have the same input/output size!");
  }

  // Initialise offspring
  var offspring = new Network(network1.input, network1.output);
  offspring.connections = [];
  offspring.nodes = [];

  // Save scores and create a copy
  var score1 = network1.score || 0;
  var score2 = network2.score || 0;

  // Determine offspring node size
  var size;
  if (equal || score1 === score2) {
    var max = Math.max(network1.nodes.length, network2.nodes.length);
    var min = Math.min(network1.nodes.length, network2.nodes.length);
    size = Math.floor(Math.random() * (max - min + 1) + min);
  } else if (score1 > score2) {
    size = network1.nodes.length;
  } else {
    size = network2.nodes.length;
  }

  // Rename some variables for easier reading
  var outputSize = network1.output;

  // Set indexes so we don't need indexOf
  var i;
  for (i = 0; i < network1.nodes.length; i++) {
    network1.nodes[i].index = i;
  }

  for (i = 0; i < network2.nodes.length; i++) {
    network2.nodes[i].index = i;
  }

  // Assign nodes from parents to offspring
  for (i = 0; i < size; i++) {
    // Determine if an output node is needed
    var node;
    if (i < size - outputSize) {
      var random = Math.random();
      node = random >= 0.5 ? network1.nodes[i] : network2.nodes[i];
      var other = random < 0.5 ? network1.nodes[i] : network2.nodes[i];

      if (typeof node === 'undefined' || node.type === 'output') {
        node = other;
      }
    } else {
      if (Math.random() >= 0.5) {
        node = network1.nodes[network1.nodes.length + i - size];
      } else {
        node = network2.nodes[network2.nodes.length + i - size];
      }
    }

    var newNode = new Node();
    newNode.bias = node.bias;
    newNode.squash = node.squash;
    newNode.type = node.type;

    offspring.nodes.push(newNode);
  }

  // Create arrays of connection genes
  var n1conns = {};
  var n2conns = {};

  // Normal connections
  for (i = 0; i < network1.connections.length; i++) {
    var conn = network1.connections[i];
    var data = {
      weight: conn.weight,
      from: conn.from.index,
      to: conn.to.index,
      gater: conn.gater != null ? conn.gater.index : -1
    };
    n1conns[Connection.innovationID(data.from, data.to)] = data;
  }

  // Selfconnections
  for (i = 0; i < network1.selfconns.length; i++) {
    var conn = network1.selfconns[i];
    var data = {
      weight: conn.weight,
      from: conn.from.index,
      to: conn.to.index,
      gater: conn.gater != null ? conn.gater.index : -1
    };
    n1conns[Connection.innovationID(data.from, data.to)] = data;
  }

  // Normal connections
  for (i = 0; i < network2.connections.length; i++) {
    var conn = network2.connections[i];
    var data = {
      weight: conn.weight,
      from: conn.from.index,
      to: conn.to.index,
      gater: conn.gater != null ? conn.gater.index : -1
    };
    n2conns[Connection.innovationID(data.from, data.to)] = data;
  }

  // Selfconnections
  for (i = 0; i < network2.selfconns.length; i++) {
    var conn = network2.selfconns[i];
    var data = {
      weight: conn.weight,
      from: conn.from.index,
      to: conn.to.index,
      gater: conn.gater != null ? conn.gater.index : -1
    };
    n2conns[Connection.innovationID(data.from, data.to)] = data;
  }

  // Split common conn genes from disjoint or excess conn genes
  var connections = [];
  var keys1 = Object.keys(n1conns);
  var keys2 = Object.keys(n2conns);
  for (i = keys1.length - 1; i >= 0; i--) {
    // Common gene
    if (typeof n2conns[keys1[i]] !== 'undefined') {
      var conn = Math.random() >= 0.5 ? n1conns[keys1[i]] : n2conns[keys1[i]];
      connections.push(conn);

      // Because deleting is expensive, just set it to some value
      n2conns[keys1[i]] = undefined;
    } else if (score1 >= score2 || equal) {
      connections.push(n1conns[keys1[i]]);
    }
  }

  // Excess/disjoint gene
  if (score2 >= score1 || equal) {
    for (i = 0; i < keys2.length; i++) {
      if (typeof n2conns[keys2[i]] !== 'undefined') {
        connections.push(n2conns[keys2[i]]);
      }
    }
  }

  // Add common conn genes uniformly
  for (i = 0; i < connections.length; i++) {
    var connData = connections[i];
    if (connData.to < size && connData.from < size) {
      var from = offspring.nodes[connData.from];
      var to = offspring.nodes[connData.to];
      var conn = offspring.connect(from, to)[0];

      conn.weight = connData.weight;

      if (connData.gater !== -1 && connData.gater < size) {
        offspring.gate(offspring.nodes[connData.gater], conn);
      }
    }
  }

  return offspring;
};

/*******************************************************************************
                                        architect
*******************************************************************************/


var architect = {
  /**
   * Constructs a network from a given array of connected nodes
   */
  Construct: function (list) {
    // Create a network
    var network = new Network(0, 0);

    // Transform all groups into nodes
    var nodes = [];

    var i;
    for (i = 0; i < list.length; i++) {
      var j;
      if (list[i] instanceof Group) {
        for (j = 0; j < list[i].nodes.length; j++) {
          nodes.push(list[i].nodes[j]);
        }
      } else if (list[i] instanceof Layer) {
        for (j = 0; j < list[i].nodes.length; j++) {
          for (var k = 0; k < list[i].nodes[j].nodes.length; k++) {
            nodes.push(list[i].nodes[j].nodes[k]);
          }
        }
      } else if (list[i] instanceof Node) {
        nodes.push(list[i]);
      }
    }

    // Determine input and output nodes
    var inputs = [];
    var outputs = [];
    for (i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].type === 'output' || nodes[i].connections.out.length + nodes[i].connections.gated.length === 0) {
        nodes[i].type = 'output';
        network.output++;
        outputs.push(nodes[i]);
        nodes.splice(i, 1);
      } else if (nodes[i].type === 'input' || !nodes[i].connections.in.length) {
        nodes[i].type = 'input';
        network.input++;
        inputs.push(nodes[i]);
        nodes.splice(i, 1);
      }
    }

    // Input nodes are always first, output nodes are always last
    nodes = inputs.concat(nodes).concat(outputs);

    if (network.input === 0 || network.output === 0) {
      throw new Error('Given nodes have no clear input/output node!');
    }

    for (i = 0; i < nodes.length; i++) {
      var j;
      for (j = 0; j < nodes[i].connections.out.length; j++) {
        network.connections.push(nodes[i].connections.out[j]);
      }
      for (j = 0; j < nodes[i].connections.gated.length; j++) {
        network.gates.push(nodes[i].connections.gated[j]);
      }
      if (nodes[i].connections.self.weight !== 0) {
        network.selfconns.push(nodes[i].connections.self);
      }
    }

    network.nodes = nodes;

    return network;
  },

  /**
   * Creates a multilayer perceptron (MLP)
   */
  Perceptron: function () {
    // Convert arguments to Array
    var layers = Array.prototype.slice.call(arguments);
    if (layers.length < 3) {
      throw new Error('You have to specify at least 3 layers');
    }

    // Create a list of nodes/groups
    var nodes = [];
    nodes.push(new Group(layers[0]));

    for (var i = 1; i < layers.length; i++) {
      var layer = layers[i];
      layer = new Group(layer);
      nodes.push(layer);
      nodes[i - 1].connect(nodes[i], methods.connection.ALL_TO_ALL);
    }

    // Construct the network
    return architect.Construct(nodes);
  },

  /**
   * Creates a randomly connected network
   */
  Random: function (input, hidden, output, options) {
    options = options || {};

    var connections = options.connections || hidden * 2;
    var backconnections = options.backconnections || 0;
    var selfconnections = options.selfconnections || 0;
    var gates = options.gates || 0;

    var network = new Network(input, output);

    var i;
    for (i = 0; i < hidden; i++) {
      network.mutate(methods.mutation.ADD_NODE);
    }

    for (i = 0; i < connections - hidden; i++) {
      network.mutate(methods.mutation.ADD_CONN);
    }

    for (i = 0; i < backconnections; i++) {
      network.mutate(methods.mutation.ADD_BACK_CONN);
    }

    for (i = 0; i < selfconnections; i++) {
      network.mutate(methods.mutation.ADD_SELF_CONN);
    }

    for (i = 0; i < gates; i++) {
      network.mutate(methods.mutation.ADD_GATE);
    }

    return network;
  },

  /**
   * Creates a long short-term memory network
   */
  LSTM: function () {
    var args = Array.prototype.slice.call(arguments);
    if (args.length < 3) {
      throw new Error('You have to specify at least 3 layers');
    }

    var last = args.pop();

    var outputLayer;
    if (typeof last === 'number') {
      outputLayer = new Group(last);
      last = {};
    } else {
      outputLayer = new Group(args.pop()); // last argument
    }

    outputLayer.set({
      type: 'output'
    });

    var options = {};
    options.memoryToMemory = last.memoryToMemory || false;
    options.outputToMemory = last.outputToMemory || false;
    options.outputToGates = last.outputToGates || false;
    options.inputToOutput = last.inputToOutput === undefined ? true : last.inputToOutput;
    options.inputToDeep = last.inputToDeep === undefined ? true : last.inputToDeep;

    var inputLayer = new Group(args.shift()); // first argument
    inputLayer.set({
      type: 'input'
    });

    var blocks = args; // all the arguments in the middle

    var nodes = [];
    nodes.push(inputLayer);

    var previous = inputLayer;
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];

      // Init required nodes (in activation order)
      var inputGate = new Group(block);
      var forgetGate = new Group(block);
      var memoryCell = new Group(block);
      var outputGate = new Group(block);
      var outputBlock = i === blocks.length - 1 ? outputLayer : new Group(block);

      inputGate.set({
        bias: 1
      });
      forgetGate.set({
        bias: 1
      });
      outputGate.set({
        bias: 1
      });

      // Connect the input with all the nodes
      var input = previous.connect(memoryCell, methods.connection.ALL_TO_ALL);
      previous.connect(inputGate, methods.connection.ALL_TO_ALL);
      previous.connect(outputGate, methods.connection.ALL_TO_ALL);
      previous.connect(forgetGate, methods.connection.ALL_TO_ALL);

      // Set up internal connections
      memoryCell.connect(inputGate, methods.connection.ALL_TO_ALL);
      memoryCell.connect(forgetGate, methods.connection.ALL_TO_ALL);
      memoryCell.connect(outputGate, methods.connection.ALL_TO_ALL);
      var forget = memoryCell.connect(memoryCell, methods.connection.ONE_TO_ONE);
      var output = memoryCell.connect(outputBlock, methods.connection.ALL_TO_ALL);

      // Set up gates
      inputGate.gate(input, methods.gating.INPUT);
      forgetGate.gate(forget, methods.gating.SELF);
      outputGate.gate(output, methods.gating.OUTPUT);

      // Input to all memory cells
      if (options.inputToDeep && i > 0) {
        var input = inputLayer.connect(memoryCell, methods.connection.ALL_TO_ALL);
        inputGate.gate(input, methods.gating.INPUT);
      }

      // Optional connections
      if (options.memoryToMemory) {
        var input = memoryCell.connect(memoryCell, methods.connection.ALL_TO_ELSE);
        inputGate.gate(input, methods.gating.INPUT);
      }

      if (options.outputToMemory) {
        var input = outputLayer.connect(memoryCell, methods.connection.ALL_TO_ALL);
        inputGate.gate(input, methods.gating.INPUT);
      }

      if (options.outputToGates) {
        outputLayer.connect(inputGate, methods.connection.ALL_TO_ALL);
        outputLayer.connect(forgetGate, methods.connection.ALL_TO_ALL);
        outputLayer.connect(outputGate, methods.connection.ALL_TO_ALL);
      }

      // Add to array
      nodes.push(inputGate);
      nodes.push(forgetGate);
      nodes.push(memoryCell);
      nodes.push(outputGate);
      if (i !== blocks.length - 1) nodes.push(outputBlock);

      previous = outputBlock;
    }

    // input to output direct connection
    if (options.inputToOutput) {
      inputLayer.connect(outputLayer, methods.connection.ALL_TO_ALL);
    }

    nodes.push(outputLayer);
    return architect.Construct(nodes);
  },

  /**
   * Creates a gated recurrent unit network
   */
  GRU: function () {
    var args = Array.prototype.slice.call(arguments);
    if (args.length < 3) {
      throw new Error('not enough layers (minimum 3) !!');
    }

    var inputLayer = new Group(args.shift()); // first argument
    var outputLayer = new Group(args.pop()); // last argument
    var blocks = args; // all the arguments in the middle

    var nodes = [];
    nodes.push(inputLayer);

    var previous = inputLayer;
    for (var i = 0; i < blocks.length; i++) {
      var layer = new Layer.GRU(blocks[i]);
      previous.connect(layer);
      previous = layer;

      nodes.push(layer);
    }

    previous.connect(outputLayer);
    nodes.push(outputLayer);

    return architect.Construct(nodes);
  },

  /**
   * Creates a hopfield network of the given size
   */
  Hopfield: function (size) {
    var input = new Group(size);
    var output = new Group(size);

    input.connect(output, methods.connection.ALL_TO_ALL);

    input.set({
      type: 'input'
    });
    output.set({
      squash: methods.activation.STEP,
      type: 'output'
    });

    var network = new architect.Construct([input, output]);

    return network;
  },

  /**
   * Creates a NARX network (remember previous inputs/outputs)
   */
  NARX: function (inputSize, hiddenLayers, outputSize, previousInput, previousOutput) {
    if (!Array.isArray(hiddenLayers)) {
      hiddenLayers = [hiddenLayers];
    }

    var nodes = [];

    var input = new Layer.Dense(inputSize);
    var inputMemory = new Layer.Memory(inputSize, previousInput);
    var hidden = [];
    var output = new Layer.Dense(outputSize);
    var outputMemory = new Layer.Memory(outputSize, previousOutput);

    nodes.push(input);
    nodes.push(outputMemory);

    for (var i = 0; i < hiddenLayers.length; i++) {
      var hiddenLayer = new Layer.Dense(hiddenLayers[i]);
      hidden.push(hiddenLayer);
      nodes.push(hiddenLayer);
      if (typeof hidden[i - 1] !== 'undefined') {
        hidden[i - 1].connect(hiddenLayer, methods.connection.ALL_TO_ALL);
      }
    }

    nodes.push(inputMemory);
    nodes.push(output);

    input.connect(hidden[0], methods.connection.ALL_TO_ALL);
    input.connect(inputMemory, methods.connection.ONE_TO_ONE, 1);
    inputMemory.connect(hidden[0], methods.connection.ALL_TO_ALL);
    hidden[hidden.length - 1].connect(output, methods.connection.ALL_TO_ALL);
    output.connect(outputMemory, methods.connection.ONE_TO_ONE, 1);
    outputMemory.connect(hidden[0], methods.connection.ALL_TO_ALL);

    input.set({
      type: 'input'
    });
    output.set({
      type: 'output'
    });

    return architect.Construct(nodes);
  }
};




/*******************************************************************************
                                         NODE
*******************************************************************************/

function Node (type) {
  this.bias = (type === 'input') ? 0 : Math.random() * 0.2 - 0.1;
  this.squash = methods.activation.LOGISTIC;
  this.type = type || 'hidden';

  this.activation = 0;
  this.state = 0;
  this.old = 0;

  // For dropout
  this.mask = 1;

  // For tracking momentum
  this.previousDeltaBias = 0;

  // Batch training
  this.totalDeltaBias = 0;

  this.connections = {
    in: [],
    out: [],
    gated: [],
    self: new Connection(this, this, 0)
  };

  // Data for backpropagation
  this.error = {
    responsibility: 0,
    projected: 0,
    gated: 0
  };
}

Node.prototype = {
  /**
   * Activates the node
   */
  activate: function (input) {
    // Check if an input is given
    if (typeof input !== 'undefined') {
      this.activation = input;
      return this.activation;
    }

    this.old = this.state;

    // All activation sources coming from the node itself
    this.state = this.connections.self.gain * this.connections.self.weight * this.state + this.bias;

    // Activation sources coming from connections
    var i;
    for (i = 0; i < this.connections.in.length; i++) {
      var connection = this.connections.in[i];
      this.state += connection.from.activation * connection.weight * connection.gain;
    }

    // Squash the values received
    this.activation = this.squash(this.state) * this.mask;
    this.derivative = this.squash(this.state, true);

    // Update traces
    var nodes = [];
    var influences = [];

    for (i = 0; i < this.connections.gated.length; i++) {
      var conn = this.connections.gated[i];
      var node = conn.to;

      var index = nodes.indexOf(node);
      if (index > -1) {
        influences[index] += conn.weight * conn.from.activation;
      } else {
        nodes.push(node);
        influences.push(conn.weight * conn.from.activation +
          (node.connections.self.gater === this ? node.old : 0));
      }

      // Adjust the gain to this nodes' activation
      conn.gain = this.activation;
    }

    for (i = 0; i < this.connections.in.length; i++) {
      var connection = this.connections.in[i];

      // Elegibility trace
      connection.elegibility = this.connections.self.gain * this.connections.self.weight *
        connection.elegibility + connection.from.activation * connection.gain;

      // Extended trace
      for (var j = 0; j < nodes.length; j++) {
        var node = nodes[j];
        var influence = influences[j];

        var index = connection.xtrace.nodes.indexOf(node);

        if (index > -1) {
          connection.xtrace.values[index] = node.connections.self.gain * node.connections.self.weight *
            connection.xtrace.values[index] + this.derivative * connection.elegibility * influence;
        } else {
          // Does not exist there yet, might be through mutation
          connection.xtrace.nodes.push(node);
          connection.xtrace.values.push(this.derivative * connection.elegibility * influence);
        }
      }
    }

    return this.activation;
  },

  /**
   * Activates the node without calculating elegibility traces and such
   */
  noTraceActivate: function (input) {
    // Check if an input is given
    if (typeof input !== 'undefined') {
      this.activation = input;
      return this.activation;
    }

    // All activation sources coming from the node itself
    this.state = this.connections.self.gain * this.connections.self.weight * this.state + this.bias;

    // Activation sources coming from connections
    var i;
    for (i = 0; i < this.connections.in.length; i++) {
      var connection = this.connections.in[i];
      this.state += connection.from.activation * connection.weight * connection.gain;
    }

    // Squash the values received
    this.activation = this.squash(this.state);

    for (i = 0; i < this.connections.gated.length; i++) {
      this.connections.gated[i].gain = this.activation;
    }

    return this.activation;
  },

  /**
   * Back-propagate the error, aka learn
   */
  propagate: function (rate, momentum, update, target) {
    momentum = momentum || 0;
    rate = rate || 0.3;

    // Error accumulator
    var error = 0;

    // Output nodes get their error from the enviroment
    if (this.type === 'output') {
      this.error.responsibility = this.error.projected = target - this.activation;
    } else { // the rest of the nodes compute their error responsibilities by backpropagation
      // error responsibilities from all the connections projected from this node
      var i;
      for (i = 0; i < this.connections.out.length; i++) {
        var connection = this.connections.out[i];
        var node = connection.to;
        // Eq. 21
        error += node.error.responsibility * connection.weight * connection.gain;
      }

      // Projected error responsibility
      this.error.projected = this.derivative * error;

      // Error responsibilities from all connections gated by this neuron
      error = 0;

      for (i = 0; i < this.connections.gated.length; i++) {
        var conn = this.connections.gated[i];
        var node = conn.to;
        var influence = node.connections.self.gater === this ? node.old : 0;

        influence += conn.weight * conn.from.activation;
        error += node.error.responsibility * influence;
      }

      // Gated error responsibility
      this.error.gated = this.derivative * error;

      // Error responsibility
      this.error.responsibility = this.error.projected + this.error.gated;
    }

    if (this.type === 'constant') return;

    // Adjust all the node's incoming connections
    for (i = 0; i < this.connections.in.length; i++) {
      var connection = this.connections.in[i];

      var gradient = this.error.projected * connection.elegibility;

      for (var j = 0; j < connection.xtrace.nodes.length; j++) {
        var node = connection.xtrace.nodes[j];
        var value = connection.xtrace.values[j];
        gradient += node.error.responsibility * value;
      }

      // Adjust weight
      var deltaWeight = rate * gradient * this.mask;
      connection.totalDeltaWeight += deltaWeight;
      if (update) {
        connection.totalDeltaWeight += momentum * connection.previousDeltaWeight;
        connection.weight += connection.totalDeltaWeight;
        connection.previousDeltaWeight = connection.totalDeltaWeight;
        connection.totalDeltaWeight = 0;
      }
    }

    // Adjust bias
    var deltaBias = rate * this.error.responsibility;
    this.totalDeltaBias += deltaBias;
    if (update) {
      this.totalDeltaBias += momentum * this.previousDeltaBias;
      this.bias += this.totalDeltaBias;
      this.previousDeltaBias = this.totalDeltaBias;
      this.totalDeltaBias = 0;
    }
  },

  /**
   * Creates a connection from this node to the given node
   */
  connect: function (target, weight) {
    var connections = [];
    if (typeof target.bias !== 'undefined') { // must be a node!
      if (target === this) {
        // Turn on the self connection by setting the weight
        if (this.connections.self.weight !== 0) {
          if (config.warnings) console.warn('This connection already exists!');
        } else {
          this.connections.self.weight = weight || 1;
        }
        connections.push(this.connections.self);
      } else if (this.isProjectingTo(target)) {
        throw new Error('Already projecting a connection to this node!');
      } else {
        var connection = new Connection(this, target, weight);
        target.connections.in.push(connection);
        this.connections.out.push(connection);

        connections.push(connection);
      }
    } else { // should be a group
      for (var i = 0; i < target.nodes.length; i++) {
        var connection = new Connection(this, target.nodes[i], weight);
        target.nodes[i].connections.in.push(connection);
        this.connections.out.push(connection);
        target.connections.in.push(connection);

        connections.push(connection);
      }
    }
    return connections;
  },

  /**
   * Disconnects this node from the other node
   */
  disconnect: function (node, twosided) {
    if (this === node) {
      this.connections.self.weight = 0;
      return;
    }

    for (var i = 0; i < this.connections.out.length; i++) {
      var conn = this.connections.out[i];
      if (conn.to === node) {
        this.connections.out.splice(i, 1);
        var j = conn.to.connections.in.indexOf(conn);
        conn.to.connections.in.splice(j, 1);
        if (conn.gater !== null) conn.gater.ungate(conn);
        break;
      }
    }

    if (twosided) {
      node.disconnect(this);
    }
  },

  /**
   * Make this node gate a connection
   */
  gate: function (connections) {
    if (!Array.isArray(connections)) {
      connections = [connections];
    }

    for (var i = 0; i < connections.length; i++) {
      var connection = connections[i];

      this.connections.gated.push(connection);
      connection.gater = this;
    }
  },

  /**
   * Removes the gates from this node from the given connection(s)
   */
  ungate: function (connections) {
    if (!Array.isArray(connections)) {
      connections = [connections];
    }

    for (var i = connections.length - 1; i >= 0; i--) {
      var connection = connections[i];

      var index = this.connections.gated.indexOf(connection);
      this.connections.gated.splice(index, 1);
      connection.gater = null;
      connection.gain = 1;
    }
  },

  /**
   * Clear the context of the node
   */
  clear: function () {
    for (var i = 0; i < this.connections.in.length; i++) {
      var connection = this.connections.in[i];

      connection.elegibility = 0;
      connection.xtrace = {
        nodes: [],
        values: []
      };
    }

    for (i = 0; i < this.connections.gated.length; i++) {
      var conn = this.connections.gated[i];
      conn.gain = 0;
    }

    this.error.responsibility = this.error.projected = this.error.gated = 0;
    this.old = this.state = this.activation = 0;
  },

  /**
   * Mutates the node with the given method
   */
  mutate: function (method) {
    if (typeof method === 'undefined') {
      throw new Error('No mutate method given!');
    } else if (!(method.name in methods.mutation)) {
      throw new Error('This method does not exist!');
    }

    switch (method) {
      case methods.mutation.MOD_ACTIVATION:
        // Can't be the same squash
        var squash = method.allowed[(method.allowed.indexOf(this.squash) + Math.floor(Math.random() * (method.allowed.length - 1)) + 1) % method.allowed.length];
        this.squash = squash;
        break;
      case methods.mutation.MOD_BIAS:
        var modification = Math.random() * (method.max - method.min) + method.min;
        this.bias += modification;
        break;
    }
  },

  /**
   * Checks if this node is projecting to the given node
   */
  isProjectingTo: function (node) {
    if (node === this && this.connections.self.weight !== 0) return true;

    for (var i = 0; i < this.connections.out.length; i++) {
      var conn = this.connections.out[i];
      if (conn.to === node) {
        return true;
      }
    }
    return false;
  },

  /**
   * Checks if the given node is projecting to this node
   */
  isProjectedBy: function (node) {
    if (node === this && this.connections.self.weight !== 0) return true;

    for (var i = 0; i < this.connections.in.length; i++) {
      var conn = this.connections.in[i];
      if (conn.from === node) {
        return true;
      }
    }

    return false;
  },

  /**
   * Converts the node to a json object
   */
  toJSON: function () {
    var json = {
      bias: this.bias,
      type: this.type,
      squash: this.squash.name,
      mask: this.mask
    };

    return json;
  }
};

/**
 * Convert a json object to a node
 */
Node.fromJSON = function (json) {
  var node = new Node();
  node.bias = json.bias;
  node.type = json.type;
  node.mask = json.mask;
  node.squash = methods.activation[json.squash];

  return node;
};

/*******************************************************************************
                                         Group
*******************************************************************************/

function Layer () {
  this.output = null;

  this.nodes = [];
  this.connections = { in: [],
    out: [],
    self: []
  };
}

Layer.prototype = {
  /**
   * Activates all the nodes in the group
   */
  activate: function (value) {
    var values = [];

    if (typeof value !== 'undefined' && value.length !== this.nodes.length) {
      throw new Error('Array with values should be same as the amount of nodes!');
    }

    for (var i = 0; i < this.nodes.length; i++) {
      var activation;
      if (typeof value === 'undefined') {
        activation = this.nodes[i].activate();
      } else {
        activation = this.nodes[i].activate(value[i]);
      }

      values.push(activation);
    }

    return values;
  },

  /**
   * Propagates all the node in the group
   */
  propagate: function (rate, momentum, target) {
    if (typeof target !== 'undefined' && target.length !== this.nodes.length) {
      throw new Error('Array with values should be same as the amount of nodes!');
    }

    for (var i = this.nodes.length - 1; i >= 0; i--) {
      if (typeof target === 'undefined') {
        this.nodes[i].propagate(rate, momentum, true);
      } else {
        this.nodes[i].propagate(rate, momentum, true, target[i]);
      }
    }
  },

  /**
   * Connects the nodes in this group to nodes in another group or just a node
   */
  connect: function (target, method, weight) {
    var connections;
    if (target instanceof Group || target instanceof Node) {
      connections = this.output.connect(target, method, weight);
    } else if (target instanceof Layer) {
      connections = target.input(this, method, weight);
    }

    return connections;
  },

  /**
   * Make nodes from this group gate the given connection(s)
   */
  gate: function (connections, method) {
    this.output.gate(connections, method);
  },

  /**
   * Sets the value of a property for every node
   */
  set: function (values) {
    for (var i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];

      if (node instanceof Node) {
        if (typeof values.bias !== 'undefined') {
          node.bias = values.bias;
        }

        node.squash = values.squash || node.squash;
        node.type = values.type || node.type;
      } else if (node instanceof Group) {
        node.set(values);
      }
    }
  },

  /**
   * Disconnects all nodes from this group from another given group/node
   */
  disconnect: function (target, twosided) {
    twosided = twosided || false;

    // In the future, disconnect will return a connection so indexOf can be used
    var i, j, k;
    if (target instanceof Group) {
      for (i = 0; i < this.nodes.length; i++) {
        for (j = 0; j < target.nodes.length; j++) {
          this.nodes[i].disconnect(target.nodes[j], twosided);

          for (k = this.connections.out.length - 1; k >= 0; k--) {
            var conn = this.connections.out[k];

            if (conn.from === this.nodes[i] && conn.to === target.nodes[j]) {
              this.connections.out.splice(k, 1);
              break;
            }
          }

          if (twosided) {
            for (k = this.connections.in.length - 1; k >= 0; k--) {
              var conn = this.connections.in[k];

              if (conn.from === target.nodes[j] && conn.to === this.nodes[i]) {
                this.connections.in.splice(k, 1);
                break;
              }
            }
          }
        }
      }
    } else if (target instanceof Node) {
      for (i = 0; i < this.nodes.length; i++) {
        this.nodes[i].disconnect(target, twosided);

        for (j = this.connections.out.length - 1; j >= 0; j--) {
          var conn = this.connections.out[j];

          if (conn.from === this.nodes[i] && conn.to === target) {
            this.connections.out.splice(j, 1);
            break;
          }
        }

        if (twosided) {
          for (k = this.connections.in.length - 1; k >= 0; k--) {
            var conn = this.connections.in[k];

            if (conn.from === target && conn.to === this.nodes[i]) {
              this.connections.in.splice(k, 1);
              break;
            }
          }
        }
      }
    }
  },

  /**
   * Clear the context of this group
   */
  clear: function () {
    for (var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].clear();
    }
  }
};

Layer.Dense = function (size) {
  // Create the layer
  var layer = new Layer();

  // Init required nodes (in activation order)
  var block = new Group(size);

  layer.nodes.push(block);
  layer.output = block;

  layer.input = function (from, method, weight) {
    if (from instanceof Layer) from = from.output;
    method = method || methods.connection.ALL_TO_ALL;
    return from.connect(block, method, weight);
  };

  return layer;
};

Layer.LSTM = function (size) {
  // Create the layer
  var layer = new Layer();

  // Init required nodes (in activation order)
  var inputGate = new Group(size);
  var forgetGate = new Group(size);
  var memoryCell = new Group(size);
  var outputGate = new Group(size);
  var outputBlock = new Group(size);

  inputGate.set({
    bias: 1
  });
  forgetGate.set({
    bias: 1
  });
  outputGate.set({
    bias: 1
  });

  // Set up internal connections
  memoryCell.connect(inputGate, methods.connection.ALL_TO_ALL);
  memoryCell.connect(forgetGate, methods.connection.ALL_TO_ALL);
  memoryCell.connect(outputGate, methods.connection.ALL_TO_ALL);
  var forget = memoryCell.connect(memoryCell, methods.connection.ONE_TO_ONE);
  var output = memoryCell.connect(outputBlock, methods.connection.ALL_TO_ALL);

  // Set up gates
  forgetGate.gate(forget, methods.gating.SELF);
  outputGate.gate(output, methods.gating.OUTPUT);

  // Add to nodes array
  layer.nodes = [inputGate, forgetGate, memoryCell, outputGate, outputBlock];

  // Define output
  layer.output = outputBlock;

  layer.input = function (from, method, weight) {
    if (from instanceof Layer) from = from.output;
    method = method || methods.connection.ALL_TO_ALL;
    var connections = [];

    var input = from.connect(memoryCell, method, weight);
    connections = connections.concat(input);

    connections = connections.concat(from.connect(inputGate, method, weight));
    connections = connections.concat(from.connect(outputGate, method, weight));
    connections = connections.concat(from.connect(forgetGate, method, weight));

    inputGate.gate(input, methods.gating.INPUT);

    return connections;
  };

  return layer;
};

Layer.GRU = function (size) {
  // Create the layer
  var layer = new Layer();

  var updateGate = new Group(size);
  var inverseUpdateGate = new Group(size);
  var resetGate = new Group(size);
  var memoryCell = new Group(size);
  var output = new Group(size);
  var previousOutput = new Group(size);

  previousOutput.set({
    bias: 0,
    squash: methods.activation.IDENTITY,
    type: 'constant'
  });
  memoryCell.set({
    squash: methods.activation.TANH
  });
  inverseUpdateGate.set({
    bias: 0,
    squash: methods.activation.INVERSE,
    type: 'constant'
  });
  updateGate.set({
    bias: 1
  });
  resetGate.set({
    bias: 0
  });

  // Update gate calculation
  previousOutput.connect(updateGate, methods.connection.ALL_TO_ALL);

  // Inverse update gate calculation
  updateGate.connect(inverseUpdateGate, methods.connection.ONE_TO_ONE, 1);

  // Reset gate calculation
  previousOutput.connect(resetGate, methods.connection.ALL_TO_ALL);

  // Memory calculation
  var reset = previousOutput.connect(memoryCell, methods.connection.ALL_TO_ALL);

  resetGate.gate(reset, methods.gating.OUTPUT); // gate

  // Output calculation
  var update1 = previousOutput.connect(output, methods.connection.ALL_TO_ALL);
  var update2 = memoryCell.connect(output, methods.connection.ALL_TO_ALL);

  updateGate.gate(update1, methods.gating.OUTPUT);
  inverseUpdateGate.gate(update2, methods.gating.OUTPUT);

  // Previous output calculation
  output.connect(previousOutput, methods.connection.ONE_TO_ONE, 1);

  // Add to nodes array
  layer.nodes = [updateGate, inverseUpdateGate, resetGate, memoryCell, output, previousOutput];

  layer.output = output;

  layer.input = function (from, method, weight) {
    if (from instanceof Layer) from = from.output;
    method = method || methods.connection.ALL_TO_ALL;
    var connections = [];

    connections = connections.concat(from.connect(updateGate, method, weight));
    connections = connections.concat(from.connect(resetGate, method, weight));
    connections = connections.concat(from.connect(memoryCell, method, weight));

    return connections;
  };

  return layer;
};

Layer.Memory = function (size, memory) {
  // Create the layer
  var layer = new Layer();
  // Because the output can only be one group, we have to put the nodes all in óne group

  var previous = null;
  var i;
  for (i = 0; i < memory; i++) {
    var block = new Group(size);

    block.set({
      squash: methods.activation.IDENTITY,
      bias: 0,
      type: 'constant'
    });

    if (previous != null) {
      previous.connect(block, methods.connection.ONE_TO_ONE, 1);
    }

    layer.nodes.push(block);
    previous = block;
  }

  layer.nodes.reverse();

  for (i = 0; i < layer.nodes.length; i++) {
    layer.nodes[i].nodes.reverse();
  }

  // Because output can only be óne group, fit all memory nodes in óne group
  var outputGroup = new Group(0);
  for (var group in layer.nodes) {
    outputGroup.nodes = outputGroup.nodes.concat(layer.nodes[group].nodes);
  }
  layer.output = outputGroup;

  layer.input = function (from, method, weight) {
    if (from instanceof Layer) from = from.output;
    method = method || methods.connection.ALL_TO_ALL;

    if (from.nodes.length !== layer.nodes[layer.nodes.length - 1].nodes.length) {
      throw new Error('Previous layer size must be same as memory size');
    }

    return from.connect(layer.nodes[layer.nodes.length - 1], methods.connection.ONE_TO_ONE, 1);
  };

  return layer;
};


/*******************************************************************************
                                         Group
*******************************************************************************/

function Group (size) {
  this.nodes = [];
  this.connections = {
    in: [],
    out: [],
    self: []
  };

  for (var i = 0; i < size; i++) {
    this.nodes.push(new Node());
  }
}

Group.prototype = {
  /**
   * Activates all the nodes in the group
   */
  activate: function (value) {
    var values = [];

    if (typeof value !== 'undefined' && value.length !== this.nodes.length) {
      throw new Error('Array with values should be same as the amount of nodes!');
    }

    for (var i = 0; i < this.nodes.length; i++) {
      var activation;
      if (typeof value === 'undefined') {
        activation = this.nodes[i].activate();
      } else {
        activation = this.nodes[i].activate(value[i]);
      }

      values.push(activation);
    }

    return values;
  },

  /**
   * Propagates all the node in the group
   */
  propagate: function (rate, momentum, target) {
    if (typeof target !== 'undefined' && target.length !== this.nodes.length) {
      throw new Error('Array with values should be same as the amount of nodes!');
    }

    for (var i = this.nodes.length - 1; i >= 0; i--) {
      if (typeof target === 'undefined') {
        this.nodes[i].propagate(rate, momentum, true);
      } else {
        this.nodes[i].propagate(rate, momentum, true, target[i]);
      }
    }
  },

  /**
   * Connects the nodes in this group to nodes in another group or just a node
   */
  connect: function (target, method, weight) {
    var connections = [];
    var i, j;
    if (target instanceof Group) {
      if (typeof method === 'undefined') {
        if (this !== target) {
          if (config.warnings) console.warn('No group connection specified, using ALL_TO_ALL');
          method = methods.connection.ALL_TO_ALL;
        } else {
          if (config.warnings) console.warn('No group connection specified, using ONE_TO_ONE');
          method = methods.connection.ONE_TO_ONE;
        }
      }
      if (method === methods.connection.ALL_TO_ALL || method === methods.connection.ALL_TO_ELSE) {
        for (i = 0; i < this.nodes.length; i++) {
          for (j = 0; j < target.nodes.length; j++) {
            if (method === methods.connection.ALL_TO_ELSE && this.nodes[i] === target.nodes[j]) continue;
            var connection = this.nodes[i].connect(target.nodes[j], weight);
            this.connections.out.push(connection[0]);
            target.connections.in.push(connection[0]);
            connections.push(connection[0]);
          }
        }
      } else if (method === methods.connection.ONE_TO_ONE) {
        if (this.nodes.length !== target.nodes.length) {
          throw new Error('From and To group must be the same size!');
        }

        for (i = 0; i < this.nodes.length; i++) {
          var connection = this.nodes[i].connect(target.nodes[i], weight);
          this.connections.self.push(connection[0]);
          connections.push(connection[0]);
        }
      }
    } else if (target instanceof Layer) {
      connections = target.input(this, method, weight);
    } else if (target instanceof Node) {
      for (i = 0; i < this.nodes.length; i++) {
        var connection = this.nodes[i].connect(target, weight);
        this.connections.out.push(connection[0]);
        connections.push(connection[0]);
      }
    }

    return connections;
  },

  /**
   * Make nodes from this group gate the given connection(s)
   */
  gate: function (connections, method) {
    if (typeof method === 'undefined') {
      throw new Error('Please specify Gating.INPUT, Gating.OUTPUT');
    }

    if (!Array.isArray(connections)) {
      connections = [connections];
    }

    var nodes1 = [];
    var nodes2 = [];

    var i, j;
    for (i = 0; i < connections.length; i++) {
      var connection = connections[i];
      if (!nodes1.includes(connection.from)) nodes1.push(connection.from);
      if (!nodes2.includes(connection.to)) nodes2.push(connection.to);
    }

    switch (method) {
      case methods.gating.INPUT:
        for (i = 0; i < nodes2.length; i++) {
          var node = nodes2[i];
          var gater = this.nodes[i % this.nodes.length];

          for (j = 0; j < node.connections.in.length; j++) {
            var conn = node.connections.in[j];
            if (connections.includes(conn)) {
              gater.gate(conn);
            }
          }
        }
        break;
      case methods.gating.OUTPUT:
        for (i = 0; i < nodes1.length; i++) {
          var node = nodes1[i];
          var gater = this.nodes[i % this.nodes.length];

          for (j = 0; j < node.connections.out.length; j++) {
            var conn = node.connections.out[j];
            if (connections.includes(conn)) {
              gater.gate(conn);
            }
          }
        }
        break;
      case methods.gating.SELF:
        for (i = 0; i < nodes1.length; i++) {
          var node = nodes1[i];
          var gater = this.nodes[i % this.nodes.length];

          if (connections.includes(node.connections.self)) {
            gater.gate(node.connections.self);
          }
        }
    }
  },

  /**
   * Sets the value of a property for every node
   */
  set: function (values) {
    for (var i = 0; i < this.nodes.length; i++) {
      if (typeof values.bias !== 'undefined') {
        this.nodes[i].bias = values.bias;
      }

      this.nodes[i].squash = values.squash || this.nodes[i].squash;
      this.nodes[i].type = values.type || this.nodes[i].type;
    }
  },

  /**
   * Disconnects all nodes from this group from another given group/node
   */
  disconnect: function (target, twosided) {
    twosided = twosided || false;

    // In the future, disconnect will return a connection so indexOf can be used
    var i, j, k;
    if (target instanceof Group) {
      for (i = 0; i < this.nodes.length; i++) {
        for (j = 0; j < target.nodes.length; j++) {
          this.nodes[i].disconnect(target.nodes[j], twosided);

          for (k = this.connections.out.length - 1; k >= 0; k--) {
            var conn = this.connections.out[k];

            if (conn.from === this.nodes[i] && conn.to === target.nodes[j]) {
              this.connections.out.splice(k, 1);
              break;
            }
          }

          if (twosided) {
            for (k = this.connections.in.length - 1; k >= 0; k--) {
              var conn = this.connections.in[k];

              if (conn.from === target.nodes[j] && conn.to === this.nodes[i]) {
                this.connections.in.splice(k, 1);
                break;
              }
            }
          }
        }
      }
    } else if (target instanceof Node) {
      for (i = 0; i < this.nodes.length; i++) {
        this.nodes[i].disconnect(target, twosided);

        for (j = this.connections.out.length - 1; j >= 0; j--) {
          var conn = this.connections.out[j];

          if (conn.from === this.nodes[i] && conn.to === target) {
            this.connections.out.splice(j, 1);
            break;
          }
        }

        if (twosided) {
          for (j = this.connections.in.length - 1; j >= 0; j--) {
            var conn = this.connections.in[j];

            if (conn.from === target && conn.to === this.nodes[i]) {
              this.connections.in.splice(j, 1);
              break;
            }
          }
        }
      }
    }
  },

  /**
   * Clear the context of this group
   */
  clear: function () {
    for (var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].clear();
    }
  }
};

/* Easier variable naming */
var selection = methods.selection;

/*******************************************************************************
                                         NEAT
*******************************************************************************/

function Neat (input, output, fitness, options) {
  this.input = input; // The input size of the networks
  this.output = output; // The output size of the networks
  this.fitness = fitness; // The fitness function to evaluate the networks

  // Configure options
  options = options || {};
  this.equal = options.equal || false;
  this.clear = options.clear || false;
  this.popsize = options.popsize || 50;
  this.elitism = options.elitism || 0;
  this.provenance = options.provenance || 0;
  this.mutationRate = options.mutationRate || 0.3;
  this.mutationAmount = options.mutationAmount || 1;

  this.fitnessPopulation = options.fitnessPopulation || false;

  this.selection = options.selection || methods.selection.POWER;
  this.crossover = options.crossover || [
    methods.crossover.SINGLE_POINT,
    methods.crossover.TWO_POINT,
    methods.crossover.UNIFORM,
    methods.crossover.AVERAGE
  ];
  this.mutation = options.mutation || methods.mutation.FFW;

  this.template = options.network || false;

  this.maxNodes = options.maxNodes || Infinity;
  this.maxConns = options.maxConns || Infinity;
  this.maxGates = options.maxGates || Infinity;

  // Custom mutation selection function if given
  this.selectMutationMethod = typeof options.mutationSelection === 'function' ? options.mutationSelection.bind(this) : this.selectMutationMethod;

  // Generation counter
  this.generation = 0;

  // Initialise the genomes
  this.createPool(this.template);
}

Neat.prototype = {
  /**
   * Create the initial pool of genomes
   */
  createPool: function (network) {
    this.population = [];

    for (var i = 0; i < this.popsize; i++) {
      var copy;
      if (this.template) {
        copy = Network.fromJSON(network.toJSON());
      } else {
        copy = new Network(this.input, this.output);
      }
      copy.score = undefined;
      this.population.push(copy);
    }
  },

  /**
   * Evaluates, selects, breeds and mutates population
   */
  evolve: function () {
    // Check if evaluated, sort the population
    if (typeof this.population[this.population.length - 1].score === 'undefined') {
      this.evaluate();
    }
    this.sort();

    var fittest = Network.fromJSON(this.population[0].toJSON());
    fittest.score = this.population[0].score;

    var newPopulation = [];

    // Elitism
    var elitists = [];
    for (var i = 0; i < this.elitism; i++) {
      elitists.push(this.population[i]);
    }

    // Provenance
    for (i = 0; i < this.provenance; i++) {
      newPopulation.push(Network.fromJSON(this.template.toJSON()));
    }

    // Breed the next individuals
    for (i = 0; i < this.popsize - this.elitism - this.provenance; i++) {
      newPopulation.push(this.getOffspring());
    }

    // Replace the old population with the new population
    this.population = newPopulation;
    this.mutate();

    // this.population.push(...elitists);
    var _this$population;
    (_this$population = this.population).push.apply(_this$population, elitists); 

    // Reset the scores
    for (i = 0; i < this.population.length; i++) {
      this.population[i].score = undefined;
    }

    this.generation++;

    return fittest;
  },

  /**
   * Breeds two parents into an offspring, population MUST be surted
   */
  getOffspring: function () {
    var parent1 = this.getParent();
    var parent2 = this.getParent();

    return Network.crossOver(parent1, parent2, this.equal);
  },

  /**
   * Selects a random mutation method for a genome according to the parameters
   */
  selectMutationMethod: function (genome) {
    var mutationMethod = this.mutation[Math.floor(Math.random() * this.mutation.length)];

    if (mutationMethod === methods.mutation.ADD_NODE && genome.nodes.length >= this.maxNodes) {
      if (config.warnings) console.warn('maxNodes exceeded!');
      return;
    }

    if (mutationMethod === methods.mutation.ADD_CONN && genome.connections.length >= this.maxConns) {
      if (config.warnings) console.warn('maxConns exceeded!');
      return;
    }

    if (mutationMethod === methods.mutation.ADD_GATE && genome.gates.length >= this.maxGates) {
      if (config.warnings) console.warn('maxGates exceeded!');
      return;
    }

    return mutationMethod;
  },

  /**
   * Mutates the given (or current) population
   */
  mutate: function () {
    // Elitist genomes should not be included
    for (var i = 0; i < this.population.length; i++) {
      if (Math.random() <= this.mutationRate) {
        for (var j = 0; j < this.mutationAmount; j++) {
          var mutationMethod = this.selectMutationMethod(this.population[i]);
          this.population[i].mutate(mutationMethod);
        }
      }
    }
  },

  /**
   * Evaluates the current population
   */
  evaluate: function () {
    var i;
    if (this.fitnessPopulation) {
      if (this.clear) {
        for (i = 0; i < this.population.length; i++) {
          this.population[i].clear();
        }
      }
      this.fitness(this.population);
    } else {
      for (i = 0; i < this.population.length; i++) {
        var genome = this.population[i];
        if (this.clear) genome.clear();
        genome.score = this.fitness(genome);
      }
    }
  },

  /**
   * Sorts the population by score
   */
  sort: function () {
    this.population.sort(function (a, b) {
      return b.score - a.score;
    });
  },

  /**
   * Returns the fittest genome of the current population
   */
  getFittest: function () {
    // Check if evaluated
    if (typeof this.population[this.population.length - 1].score === 'undefined') {
      this.evaluate();
    }
    if (this.population[0].score < this.population[1].score) {
      this.sort();
    }

    return this.population[0];
  },

  /**
   * Returns the average fitness of the current population
   */
  getAverage: function () {
    if (typeof this.population[this.population.length - 1].score === 'undefined') {
      this.evaluate();
    }

    var score = 0;
    for (var i = 0; i < this.population.length; i++) {
      score += this.population[i].score;
    }

    return score / this.population.length;
  },

  /**
   * Gets a genome based on the selection function
   * @return {Network} genome
   */
  getParent: function () {
    var i;
    switch (this.selection) {
      case selection.POWER:
        if (this.population[0].score < this.population[1].score) this.sort();

        var index = Math.floor(Math.pow(Math.random(), this.selection.power) * this.population.length);
        return this.population[index];
      case selection.FITNESS_PROPORTIONATE:
        // As negative fitnesses are possible
        // https://stackoverflow.com/questions/16186686/genetic-algorithm-handling-negative-fitness-values
        // this is unnecessarily run for every individual, should be changed

        var totalFitness = 0;
        var minimalFitness = 0;
        for (i = 0; i < this.population.length; i++) {
          var score = this.population[i].score;
          minimalFitness = score < minimalFitness ? score : minimalFitness;
          totalFitness += score;
        }

        minimalFitness = Math.abs(minimalFitness);
        totalFitness += minimalFitness * this.population.length;

        var random = Math.random() * totalFitness;
        var value = 0;

        for (i = 0; i < this.population.length; i++) {
          var genome = this.population[i];
          value += genome.score + minimalFitness;
          if (random < value) return genome;
        }

        // if all scores equal, return random genome
        return this.population[Math.floor(Math.random() * this.population.length)];
      case selection.TOURNAMENT:
        if (this.selection.size > this.popsize) {
          throw new Error('Your tournament size should be lower than the population size, please change methods.selection.TOURNAMENT.size');
        }

        // Create a tournament
        var individuals = [];
        for (i = 0; i < this.selection.size; i++) {
          var random = this.population[Math.floor(Math.random() * this.population.length)];
          individuals.push(random);
        }

        // Sort the tournament individuals by score
        individuals.sort(function (a, b) {
          return b.score - a.score;
        });

        // Select an individual
        for (i = 0; i < this.selection.size; i++) {
          if (Math.random() < this.selection.probability || i === this.selection.size - 1) {
            return individuals[i];
          }
        }
    }
  },
  
  
  test: function (L,data) {
    
  },

  /**
   * Export the current population to a json object
   */
  export: function () {
    var json = [];
    for (var i = 0; i < this.population.length; i++) {
      var genome = this.population[i];
      json.push(genome.toJSON());
    }

    return json;
  },

  /**
   * Import population from a json object
   */
  import: function (json) {
    var population = [];
    for (var i = 0; i < json.length; i++) {
      var genome = json[i];
      population.push(Network.fromJSON(genome));
    }
    this.population = population;
    this.popsize = population.length;
  }
};


var Neataptic = {
  methods: methods,
  Connection: Connection,
  architect: architect,
  Network: Network,
  config: config,
  Group: Group,
  Layer: Layer,
  Node: Node,
  Neat: Neat
};

module.exports = Neataptic
