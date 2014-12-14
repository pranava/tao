function SimulationGenerator(result) {
  this.mustacheSimulation = result;
  this.sim = "";
}

SimulationGenerator.prototype.renderSimulation = function () {

  function stringify(parameters) {
    var toReturn = "{";
    for (var key in parameters) {
      toReturn += key;
      toReturn += ": ";
      toReturn += parameters[key];
      toReturn += ",";
    }


    if (toReturn.charAt(toReturn.length - 1) == ",") {
      toReturn = toReturn.substr(0, toReturn.length - 1);
    }

    toReturn += "}";
    return toReturn;
  }

  Handlebars.registerHelper('parameters', function(parameters, options) {
    if (parameters) {
      return options.fn({
        'params': stringify(parameters)
      })
    } else {
      return options.fn({
        'params': '{}'
      });
    }
  });

  Handlebars.registerHelper('getSchedulingEdges', function (edges, eventName, options) {
    correctEdges = getObjects(edges, "source", eventName);
    var out = "";
    for (var i = 0; i < correctEdges.length; i++) {
      if (correctEdges[i].edgeType == "Scheduling")
        out += options.fn(correctEdges[i]);
    }
    return out;
  });

  Handlebars.registerHelper('getPendingEdges', function (edges, eventName, options) {
    correctEdges = getObjects(edges, "source", eventName);
    var out = "";
    for (var i = 0; i < correctEdges.length; i++) {
      if (correctEdges[i].edgeType == "Pending")
        out += options.fn(correctEdges[i]);
    }
    return out;
  });

  Handlebars.registerHelper('pendingEdgeLength', function (edges, eventName, options) {
    correctEdges = getObjects(edges, "source", eventName);
    var list = [];
    for (var i = 0; i < correctEdges.length; i++) {
      if (correctEdges[i].edgeType == "Pending")
        list.push(options.fn(correctEdges[i]));
    }
    return options.fn({
      'length': list.length
    });
  });

  Handlebars.registerHelper('getEvent', function (events, targetEventName, options) {
    correctEvent = getObjects(events, "name", targetEventName);
    return options.fn(correctEvent[0]);
  });

  Handlebars.registerHelper('variableEach', function(context, options) {
    var fn = options.fn,
      inverse = options.inverse,
      ctx;
    var ret = "";

    if (context && context.length > 0) {
      for (var i = 0, j = context.length; i < j; i++) {
        ctx = Object.create(context[i]);
        ctx.index = i + 1;
        if (i + 1 == j) {
          ctx.last = true;
        }
        ret = ret + fn(ctx);
      }
    } else {
      ret = inverse(this);
    }
    return ret;
  });


  var source = $("#erg").html();
  var template = Handlebars.compile(source);

  var simulation = this.mustacheSimulation;

  var rendered = template(simulation);
  //get rid of the pesky extra comma in the argument declaration
  var partial1 = rendered.substring(0, rendered.indexOf(')') - 2);
  var partial2 = rendered.substring(rendered.indexOf(')'));
  rendered = partial1 + partial2;
  this.sim = rendered;
  
  return rendered;
}

function getObjects(obj, key, val) {
  var newObj = [];
  $.each(obj, function () {
    var testObject = this;
    $.each(testObject, function (k, v) {
      if (val == v && k == key) {
        newObj.push(testObject);
      }
    });
  });

  return (newObj);
}

window.SimulationGenerator = SimulationGenerator;