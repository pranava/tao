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

      params.unshift(0);


      var toRun = new(Simulation.bind.apply(Simulation, params))();
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

        contents.hide();
        erg.deleteSelected();
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
            // console.log(reader.result);
            var json = eval('(' + reader.result + ')');
            erg.deleteAll();
            globalPanel.globalVariablesUl.empty();

            //load name
            $('#simulationName').val(json.name);

            //load variables
            for (var variable in json.variables) {
              var container = $('<li></li>').addClass('variables');
              var nameSpan = $('<span></span>').addClass('code').addClass('variableName').text(json.variables[variable].name);
              var deleteAnchor = $('<a></a>').addClass('right').attr('href', '#').text('✕');
              var initialValue = $('<input></input>').attr('placeholder', 'Initial Value').addClass('initialVal');

              container.append(nameSpan).append(deleteAnchor).append(initialValue);
              deleteAnchor.on('click', function() {
                container.remove();
              });

              globalPanel.globalVariablesUl.append(container);
            }

            //load events
            for (event in json.events) {
              // this.createEdge(this.events[0], this.events[1], 0, 'true', 0, {});
              var e = json.events[event];
              var color = 'blue';
              if (e.name == "Run") {
                color = 'green';
              }
              erg.createEvent(e.x, e.y, e.stateChange, e.name, e.parameters, color);
            }

            //load edges
            for (edge in json.edges) {
              var e = json.edges[edge];
              erg.createEdgeByName(e.source, e.target, e.delay, e.condition, e.priority, e.parameters);
            }

          }

          //asynchronous, set call back above for execution onload.
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
    edgePanel.load(edge);
    contents.show();
  }

  function eventSelected(node) {
    clearContent();
    eventPanel.load(node);
    contents.show();
  }

  initialize();

}(jQuery, window));