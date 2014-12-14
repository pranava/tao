(function($, window) {

  var body, stage, erg, contents;
  var EventRelationGraph = window.EventRelationGraph;
  var EventPanel = window.EventPanel;
  var EdgePanel = window.EdgePanel;
  var GlobalPanel = window.GlobalPanel;

  function initialize() {

    body = $('body');
    stage = $('#stage');
    contents = $('#contents');
    run = $('#run');
    globals = $('#globals');
    open = $('#open');

    editor = $('.editor', contents);
    footer = $('.footer', contents);

    erg = new EventRelationGraph(stage, eventSelected, edgeSelected);
    eventPanel = new EventPanel(editor, footer);
    edgePanel = new EdgePanel(editor, footer);
    globalPanel = new GlobalPanel(editor, footer);

    open.click(function(e) {
      $('#file_input').click();
    });

    run.click(function(e) {
      var sim = new SimulationGenerator(erg.getJSON());
      var Simulation = eval('(' + sim.renderSimulation() + ')');

      var params = [];
      var arr = $('.variables');

      arr.each(function() {
        params.push(eval('(' + $(this).find('.initialVal').val() + ')'));
      });

      var toRun = function(p){
        var s = function() { Simulation.apply(this, p) };
        s.prototype = this.prototype;
        return new s();
      }(params);

      var eng = new Engine(lifoRank);
      eng.execute(toRun, parseInt($('#timeUnits').val()));
    });

    globals.click(function(e) {
      erg.clearContext();
      clearContent();

      globalPanel.show(erg);
      contents.show();
    });

    stage.click(function(e) {
      if (e.target == this) {
        erg.clearContext();
        clearContent();
        contents.hide();
      }
    });

    stage.dblclick(function(e) {
      if (e.target == this) {
        erg.createEvent(e.clientX, e.clientY);
      }
    });

    body.keyup(function(e) {
      if (
        (e.target == this) &&
        (e.keyCode == 8 || e.keyCode == 46 || e.keyCode == 190)) {

        if (erg.deleteSelected()) {
          contents.hide();  
        }
      }
    });

    window.onload = function() {
      var fileInput = document.getElementById('file_input');

      fileInput.addEventListener('change', function(e) {
        var file = fileInput.files[0];
        var textType = /text.*/;

        if (file.type.match(textType)) {
          var reader = new FileReader();

          reader.onload = function(e) {
            var json = eval('(' + reader.result + ')');
            erg.deleteAll();
            globalPanel.globalVariablesUl.empty();

            //load name
            $('#simulationName').val(json.name);

            //put in a time so that a poor user won't have to encounter infinite loops
            $('#timeUnits').val('0');

            //get the user instructions for the simulation
            $('#simulationDescription').val(json.description);

            //load variables
            for (var variable in json.variables) {
              var currentVar = json.variables[variable];
              var container = $('<li></li>').addClass('variables');

              var nameSpan = $('<span></span>').addClass('code').addClass('variableName').text(currentVar.name);
              var deleteAnchor = $('<a></a>').addClass('right').attr('href', '#').text('✕');
              var initialValue = $('<input></input>').attr('placeholder', 'Initial Value').addClass('initialVal');
              var description = $('<input></input>').attr('placeholder', 'Description').addClass('paramDescription').val(currentVar.description);

              container.append(nameSpan).append(deleteAnchor).append(initialValue).append(description);
              deleteAnchor.on('click', (function(c) { 
                return (function() {
                  c.remove();
                })
              })(container));

              globalPanel.globalVariablesUl.append(container);
            }

            //load events
            for (event in json.events) {
              var e = json.events[event];
              var color = 'blue';
              var trace = e.trace || "true";

              if (e.name == "Run") {
                color = 'green';
              }
              erg.createEvent(e.x, e.y, e.stateChange, e.name, e.parameters, color, trace);
            }

            //load edges
            for (edge in json.edges) {
              var e = json.edges[edge];
              var edgeType = e.edgeType || "Scheduling";
              erg.createEdgeByName(e.source, e.target, e.delay, e.condition, e.priority, e.parameters, edgeType);
            }

          }

          //asynchronous, set call back above for execution onload
          reader.readAsText(file);
        } else {
          alert('Please upload a text file.');
        }
      });
    }

  }

  function clearContent() {
    eventPanel.clear();
    edgePanel.clear();
    globalPanel.clear();
  }

  function edgeSelected(edge) {
    clearContent();
    edgePanel.loadMultipleEdges(erg.getEdgeByNodes(edge.origin.title, edge.destination.title), erg);
    // edgePanel.load(edge);
    contents.show();
  }

  function eventSelected(node) {
    clearContent();
    eventPanel.load(node);
    contents.show();
  }



  initialize();

}(jQuery, window));