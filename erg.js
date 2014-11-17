(function($, window) {

  var Node = window.Node;
  var Segment = window.Segment;

  var NODE_DIMENSIONS = {
    w: 65,
    h: 65
  };

  function EventRelationGraph(stage, eventSelect, edgeSelect) {
    this.stage = stage;
    this.events = [];
    this.edges = [];

    this.eventSelect = eventSelect;
    this.edgeSelect = edgeSelect;

    this.run = this.createEvent(75, 75, '', 'Run', {}, 'green');

    this.edgeSource = null;
    this.selectedPartical = null;
  }

  EventRelationGraph.prototype.createEvent = function(x, y, stateChange, title, parameters, themeName) {
    title = title || 'Event' + this.events.length;
    parameters = parameters || {};

    var edgeX = x - (NODE_DIMENSIONS.w / 2);
    var edgeY = y - (NODE_DIMENSIONS.h / 2);
    var defaultTheme = themeName ? Node.themes[themeName] : null;

    var self = this;
    var node = new Node({
      title: title,
      stateChange: stateChange,
      stage: this.stage,
      w: NODE_DIMENSIONS.w,
      h: NODE_DIMENSIONS.h,
      x: edgeX,
      y: edgeY,
      jsonX: x,
      jsonY: y,
      parameters: parameters,
      defaultTheme: defaultTheme,
      events: {
        click: this.eventClick(this)
      }
    });

    this.events.push(node);
    node.attach();
    return node;
  }

  EventRelationGraph.prototype.deleteSelected = function() {

    var edgesLeadingToNode = [];

    //find all edges leading to or away from selected node (if node)
    for (var edge in this.edges) {
      if (_.isEqual(this.edges[edge].destination, this.selectedPartical) ||
          _.isEqual(this.edges[edge].origin, this.selectedPartical)) {
        edgesLeadingToNode.push(edge);
      }
    }

    //delete node
    for (var event in this.events) {
      if (_.isEqual(this.events[event], this.selectedPartical)) {
        delete this.events[event];
      }
    }

    //delete edge if selected partical is edge
    for (var edge in this.edges) {
      if (_.isEqual(this.edges[edge], this.selectedPartical)) {
        delete this.edges[edge];
      }
    }

    //if node, delete all edges leading to and away from node
    for (var index in edgesLeadingToNode) {
      delete this.edges[edgesLeadingToNode[index]];
    }
    console.log('being called')
    this.selectedPartical.remove();
    this.clearContext();
  }

  EventRelationGraph.prototype.createEdge = function(source, target, delay, condition, priority, parameters) {
    var edge = Segment.build({
      h: 2,
      stage: this.stage,
      origin: source,
      destination: target,
      delay: delay,
      condition: condition,
      priority: priority,
      parameters: parameters,
      events: {
        click: this.edgeClick(this)
      }
    });

    this.edges.push(edge);
    edge.attach();
    return edge;
  }

  EventRelationGraph.prototype.createEdgeByName = function(source, target, delay, condition, priority, parameters) {
    var objSource = null;
    var objDestination = null;
    for (var event in this.events) {
      if (this.events[event].title == source) {
        objSource = this.events[event];
      }
      if (this.events[event].title == target) {
        objDestination = this.events[event];
      }
    }
    var edge = Segment.build({
      h: 2,
      stage: this.stage,
      origin: objSource,
      destination: objDestination,
      delay: delay,
      condition: condition,
      priority: priority,
      parameters: parameters,
      events: {
        click: this.edgeClick(this)
      }
    });

    this.edges.push(edge);
    edge.attach();
    return edge;
  }

  EventRelationGraph.prototype.clearContext = function() {
    var nodesToRevert = [this.edgeSource, this.selectedPartical];
    for (var i = 0; i < nodesToRevert.length; i++) {
      if (nodesToRevert[i]) {
        nodesToRevert[i].setTheme(nodesToRevert[i].defaultTheme);  
      }
    }

    this.edgeSource = null;
    this.selectedPartical = null
  }

  EventRelationGraph.prototype.eventClick = function(erg) {
    return (function(e) {
      var node = this;
      if (e.shiftKey) {
        if (erg.edgeSource) {
          // Create an edge using a previous source.
          erg.createEdge(erg.edgeSource, node, 0, 'true', 0, []);
          erg.clearContext();
        } else {
          // Set a node to be the source for edge creation.
          erg.clearContext();
          erg.edgeSource = node;
          erg.edgeSource.setTheme(Node.themes.purple);
        }
      } else {
        // Select a node for editing.
        erg.clearContext();
        erg.selectedPartical = node;
        erg.selectedPartical.setTheme(Node.themes.orange);

        erg.eventSelect.call(this, node);
      }
    });
  }

  EventRelationGraph.prototype.edgeClick = function(erg) {
    return (function(e) {
      var edge = this;

      erg.clearContext();
      erg.selectedPartical = edge;
      erg.selectedPartical.setTheme(Segment.themes.red);

      erg.edgeSelect.call(this, edge);
    });
  }

  EventRelationGraph.prototype.deleteAll = function() {
    for (var event in this.events) {
      this.events[event].remove();
      delete this.events[event];
    }

    for (var edge in this.edges) {
      delete this.edges[edge];
    }
  }

  EventRelationGraph.prototype.getJSON = function(erg) {
    var json = {};
    json.name = $('#simulationName').val();
    json.variables = [];
    json.edges = [];
    json.events = [];

    var arr = $('.variables');
    arr.each(function() {
      json.variables.push({
        'name': $(this).find('.variableName').text(),
        'description': ''
      });
    });

    for (var edge in this.edges) {
      json.edges.push({
        'source': this.edges[edge].origin.title,
        'target': this.edges[edge].destination.title,
        'delay': this.edges[edge].delay,
        'condition': this.edges[edge].condition,
        'parameters': this.edges[edge].parameters,
        'priority': this.edges[edge].priority
      });
    }

    for (var event in this.events) {
      json.events.push({
        'name': this.events[event].title,
        'stateChange': this.events[event].stateChange,
        'x': this.events[event].jsonX,
        'y': this.events[event].jsonY,
        'parameters': this.events[event].parameters
      });

    }

    return json;
  }


  window.EventRelationGraph = EventRelationGraph;

}(jQuery, window));