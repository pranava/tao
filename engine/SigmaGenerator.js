(function($, window) {

  function SigmaGenerator(json) {
    this.json = json;
  }

  SigmaGenerator.prototype.template = function() {  
    var source = $("#modFile").html();
    var template = Handlebars.compile(source);
    return template(this.json);
  }

  var sub_edge_id = 1;

    function getObjects(obj, key, val) {
      var newObj = [];
      $.each(obj, function() {
        var testObject = this;
        $.each(testObject, function(k, v) {
          if (val == v && k == key) {
            newObj.push(testObject);
          }
        });
      });

      return (newObj);
    }

    function edgeLookup(e1, e2, edges) {
      var to_return_edges = [];


      e1edges_source_version = getObjects(edges, "source", e1.name);
      e1edges_final = getObjects(e1edges_source_version, "target", e2.name);

      e2edges_source_version = getObjects(edges, "source", e2.name);
      e2edges_final = getObjects(e2edges_source_version, "target", e1.name);

      for (var i = 0; i < e1edges_final.length; i++) {
        e1edges_final[i].id = sub_edge_id;
        to_return_edges.push(e1edges_final[i]);
        sub_edge_id++;

      }

      for (var j = 0; j < e2edges_final.length; j++) {
        if (!contains(e2edges_final[j], e1edges_final)) {
          e2edges_final[j].id = sub_edge_id;
          to_return_edges.push(e2edges_final[j]);
          sub_edge_id++;
        }
      }

      return to_return_edges;
    }

    function contains(obj, arr) {
      var contain = false;
      $.each(arr, function() {
        if (obj.source == this.source && obj.target == this.target) {
          contain = true;
        }
      });
      return contain;
    }

    Handlebars.registerHelper('each_with_index', function(context, options) {
      var fn = options.fn,
        inverse = options.inverse,
        ctx;
      var ret = "";

      if (context && context.length > 0) {
        for (var i = 0, j = context.length; i < j; i++) {
          ctx = Object.create(context[i]);
          ctx.index = i + 1;
          ret = ret + fn(ctx);
        }
      } else {
        ret = inverse(this);
      }
      return ret;
    });

    Handlebars.registerHelper('each_variable_with_commas', function(variables, options) {
      var toReturn = "";
      $.each(variables, function() {
        toReturn += this.name.toUpperCase() + ',';
      })

      return options.fn({
        "variables": toReturn.substr(0, toReturn.length - 1)
      });
    });

    //this handler tkes care of all graphic edge and sub edge logic by creating an object that has everything needed
    Handlebars.registerHelper('super_each', function(edges, events, options) {
      var toReturn = {};
      toReturn.graphicalEdges = [];

      for (var i = 0; i < events.length; i++) {
        for (var j = i; j < events.length; j++) {
          var sub_edges = edgeLookup(events[i], events[j], edges);
          if (!_.isEmpty(sub_edges)) {
            toReturn.graphicalEdges.push({
              "sub_edges": sub_edges
            });
          }
        }
      }
      sub_edge_id = 1;


      return options.fn({
        "toReturn": toReturn
      });
    });

    Handlebars.registerHelper('toUpper', function(string, options) {
      return options.fn({
        'upper': string.toUpperCase()
      });
    });

    Handlebars.registerHelper('javascriptToCEvents', function(string, options) {
      if (string) {
        string = string.replace(/globals./g, '');
        string = string.replace(/;/g, ',');
        string = string.replace(/\n/g, '');
        string = string.replace(/ /g, '');
        string = string.toUpperCase();
        if (string.charAt(string.length - 1) == ',') {
          string = string.substr(0, string.length - 1)
        }
        return options.fn({
          'cString': string
        });
      } else {
        return options.fn({
          'cString': ''
        });
      }
    });

    Handlebars.registerHelper('javascriptToCEdges', function(string, options) {
      if (string) {
        string = string.replace(/globals./g, '');
        string = string.replace(/;/g, ',');
        string = string.replace(/\n/g, '');
        string = string.replace(/ /g, '');
        string = string.toUpperCase();
        if (string.charAt(string.length - 1) == ',') {
          string = string.substr(0, string.length - 1)
        }
        if (string == 'TRUE') {
          string = '1==1'
        }
        return options.fn({
          'cString': string
        });
      } else {
        return options.fn({
          'cString': ''
        });
      }
    });

    Handlebars.registerHelper('locationHelper', function(x, y, options) {
      return options.fn({
        'newX': ((x / screen.width) * 10).toFixed(2),
        'newY': (((y / screen.height) * 10).toFixed(2) * -1)
      });
    });

    Handlebars.registerHelper('modFileParameters', function(parameters, name, variables, options) {
      var runParams = "";
      for (var i = 0; i < variables.length; i++) {
        runParams += variables[i].name.toUpperCase() + ',';
      }
      runParams = runParams.substr(0, runParams.length - 1);

      if (name.toUpperCase() == 'RUN') {
        return options.fn({
          'params': runParams
        });
      }
    });

    Handlebars.registerHelper('initialValues', function(options) {
      //can only generate sigma file if variables are all ints.
      var toReturn = "";
      var arr = $('.variables');
      arr.each(function() {
        toReturn += parseInt($(this).find('.initialVal').val()) + ",";
      });

      toReturn = toReturn.substr(0, toReturn.length - 1);

      return options.fn({
        'initialVals': toReturn
      })
    });

    Handlebars.registerHelper('time', function(options) {
      //can only generate sigma file if variables are all ints.
      return options.fn({
        'timeUnits': $('#timeUnits').val()
      })
    });

window.SigmaGenerator = SigmaGenerator;

}(jQuery, window));